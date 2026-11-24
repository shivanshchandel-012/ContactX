import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function uploadContactPhoto(buffer, userId) {
  configure();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `contactx/${userId}`,
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function deleteContactPhoto(publicId) {
  if (!publicId) return;
  configure();
  await cloudinary.uploader.destroy(publicId);
}