import archiver from "archiver";
import fs from "fs";
import e from "./utils/escape";

function ZipChapter(path: string) {
  const [name, chapter] = path.split("/").slice(-2);
  // console.log(name, chapter);

  const output = fs.createWriteStream(`./output/${name}/${chapter}.cbz`);
  // archiver with no compression
  const archive = archiver("zip", {
    // zlib: { level: 9 }, // Sets the compression level.
    store: true, // Sets the compression method to STORE.
  });

  output.on("close", function () {
    console.log(
      `${e.green} Finished '${e.cyan}${name}${e.end}' ${e.red}${chapter}${
        e.end
      } ${e.green}(${e.cyan}${archive.pointer()}${e.green} bytes)${e.end}`
    );
  });

  output.on("end", function () {
    console.log("Data has been drained");
  });

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });
  archive.pipe(output);

  const files = fs.readdirSync(path);
  files.forEach((file) => {
    archive.file(`${path}/${file}`, { name: file });
  });

  archive.finalize();
}

function getFoldersInPath(path: string) {
  const folders = fs.readdirSync(path);
  return folders;
}

const path = "./images/When Did We Start Dating";
// make sure ./output/{name} exists
if (!fs.existsSync(`./output/${path.split("/").slice(-1)[0]}`)) {
  fs.mkdirSync(`./output/${path.split("/").slice(-1)[0]}`);
}

const folders = getFoldersInPath(path);
// sort folders fully so that 1 comes before 10
folders.sort((a, b) => {
  const aNum = parseInt(a.split("-")[1]);
  const bNum = parseInt(b.split("-")[1]);
  return aNum - bNum;
});

const start = Date.now();
folders.forEach((folder) => {
  ZipChapter(`${path}/${folder}`);
});

process.on("exit", function () {
  const end = Date.now();
  console.log();

  console.log(`Time taken: ${end - start}ms`);
});
