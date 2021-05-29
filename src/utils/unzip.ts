import fs from "fs";
import zlib from "zlib";

export function unzipGzFile(src: string, dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const fileContents = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);
    const unzip = zlib.createGunzip();

    fileContents
      .pipe(unzip)
      .pipe(writeStream)
      .on("finish", (err: Error) => {
        if (err) return reject(err.message);
        else resolve();
      });
  });
}
