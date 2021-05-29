import fs from "fs";
import https from "https";
import { emptyFunction } from "./misc";

export function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest, { flags: "wx" });

    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        fs.unlink(dest, emptyFunction); // Delete temp file
        reject(
          `Server responded with ${response.statusCode || "no-status-code"}: ${
            response.statusMessage || "no-status-message"
          }`
        );
      }
    });

    request.on("error", (err: Error) => {
      file.close();
      fs.unlink(dest, emptyFunction); // Delete temp file
      reject(err.message);
    });

    file.on("finish", () => {
      resolve();
    });

    file.on("error", (err: Error) => {
      file.close();
      fs.unlink(dest, emptyFunction); // Delete temp file
      reject(err.message || "error");
    });
  });
}
