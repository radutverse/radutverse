import { NextRequest } from "next/server";

export async function parseFormData(request: NextRequest) {
  const formData = await request.formData();

  const files: { [key: string]: File } = {};
  const fields: { [key: string]: string | string[] } = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      if (fields[key]) {
        const existing = fields[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          fields[key] = [existing as string, value];
        }
      } else {
        fields[key] = value;
      }
    }
  }

  return { files, fields };
}

export async function getFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
