import { NextResponse } from "next/server";
import path from "path";
import { existsSync, readdirSync } from "fs";

export async function GET() {
  const cwd = process.cwd();

  const publicDir = path.join(cwd, "public");
  const photosDir = path.join(publicDir, "photos");

  const hasPublic = existsSync(publicDir);
  const hasPhotos = existsSync(photosDir);

  const photos = hasPhotos ? readdirSync(photosDir) : [];

  return NextResponse.json({
    cwd,
    publicDir,
    photosDir,
    hasPublic,
    hasPhotos,
    photos,
  });
}
