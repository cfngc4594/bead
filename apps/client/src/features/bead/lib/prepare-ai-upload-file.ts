const MAX_IMAGE_EDGE = 2048;

export async function prepareAiUploadFile(file: File): Promise<File> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("请选择图片文件");
  }

  const image = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_EDGE / Math.max(image.width, image.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("无法处理图片");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("无法编码图片"));
      },
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], "ai-input.jpg", { type: "image/jpeg" });
}
