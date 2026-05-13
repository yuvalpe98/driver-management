import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { geocode, haversineKm } from "@/lib/geocode";
import { NextResponse } from "next/server";

interface RequestedItem { name: string; quantity: number }

export async function GET(req: Request) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") ?? "";
  // items param: "VentPro:2,Mask:5"
  const itemsParam = searchParams.get("items") ?? "";
  const requestedItems: RequestedItem[] = itemsParam
    ? itemsParam.split(",").flatMap((s) => {
        const [name, qty] = s.split(":");
        return name && qty ? [{ name: name.trim(), quantity: parseInt(qty, 10) || 1 }] : [];
      })
    : [];

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      inventory: { select: { name: true, quantity: true } },
      assignedTasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: { deliveryAddress: true },
      },
    },
  });

  // Geocode the target address (best-effort)
  const targetCoords = address.length >= 5 ? await geocode(address) : null;

  const results = await Promise.all(
    drivers.map(async (driver) => {
      // Check inventory sufficiency
      const inventoryMap = new Map(driver.inventory.map((i) => [i.name, i.quantity]));
      const hasAllItems = requestedItems.every(
        (req) => (inventoryMap.get(req.name) ?? 0) >= req.quantity
      );
      const inventoryMatch = requestedItems.map((req) => ({
        name: req.name,
        requested: req.quantity,
        available: inventoryMap.get(req.name) ?? 0,
        sufficient: (inventoryMap.get(req.name) ?? 0) >= req.quantity,
      }));

      // Geographic proximity via existing open tasks
      let minDistanceKm: number | null = null;
      if (targetCoords && driver.assignedTasks.length > 0) {
        const distances = await Promise.all(
          driver.assignedTasks.map(async (t) => {
            const coords = await geocode(t.deliveryAddress);
            return coords ? haversineKm(targetCoords, coords) : null;
          })
        );
        const valid = distances.filter((d): d is number => d !== null);
        if (valid.length > 0) minDistanceKm = Math.min(...valid);
      }

      return {
        id: driver.id,
        name: driver.name,
        hasAllItems,
        inventoryMatch,
        distanceKm: minDistanceKm,
        openTaskCount: driver.assignedTasks.length,
      };
    })
  );

  // Sort: drivers with all items first, then by distance (nulls last), then by workload
  results.sort((a, b) => {
    if (a.hasAllItems !== b.hasAllItems) return a.hasAllItems ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    return a.openTaskCount - b.openTaskCount;
  });

  return NextResponse.json(results.slice(0, 3));
}
