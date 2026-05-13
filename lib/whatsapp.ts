function normalizePhone(phone: string): string {
  // Strip spaces, dashes, parentheses
  const digits = phone.replace(/[\s\-().+]/g, "");
  // Israeli mobile: 05X... → 9725X...
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  // Already international without +
  return digits;
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const instanceId = process.env["GREEN_API_INSTANCE_ID"];
  const token = process.env["GREEN_API_TOKEN"];
  if (!instanceId || !token) return;

  const chatId = normalizePhone(phone) + "@c.us";

  await fetch(
    `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    }
  );
}
