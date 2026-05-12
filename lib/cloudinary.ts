import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key:    process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure:     true,
});

export async function uploadSignature(base64: string): Promise<string> {
  const dataUri = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder:         "driver-signatures",
    resource_type:  "image",
    format:         "png",
    type:           "authenticated", // private — not publicly guessable
  });

  return result.secure_url;
}
