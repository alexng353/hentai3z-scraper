import fetch from "node-fetch";
import fs from "fs";

const e = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  end: "\x1b[0m",
};

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

async function getChapterID(url: string): Promise<string> {
  const res = await fetch(url);
  const body = await res.text();
  const head = body.match(/<head>[\s\S]*<\/head>/g);
  // log head
  const regex = /https:\/\/hentai3z.com\/\?p=\d+/g;

  if (!head) {
    console.log("No head found");
    throw new Error("No head found");
  }
  const matches = head[0]?.match(regex);
  // regex for numbers only
  const regex2 = /\d+/g;
  // get all numbers
  const numbers = matches?.map((match) => {
    const number = match.match(regex2);
    return number?.[1];
  });
  if (!numbers) {
    console.log("No chapter id found");
    // raise error
    throw new Error("No chapter id found");
  }
  if (numbers[0]) {
    return numbers[0];
  } else {
    throw new Error("No chapter id found");
  }
}

async function getChapterList(id: string, url: string): Promise<string[]> {
  const res = await fetch("https://hentai3z.com/wp-admin/admin-ajax.php", {
    headers: {
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua":
        '"Chromium";v="106", "Microsoft Edge";v="106", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      cookie:
        "wpmanga-reading-history=W3siaWQiOjE3MzYsImMiOiIzNjg4MSIsInAiOjEsImkiOiIiLCJ0IjoxNjY0MzcxNTU3fV0%3D",
      Referer: url,
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
    body: `action=manga_get_chapters&manga=${id}`,
    method: "POST",
  });
  // regex for https://hentai3z.com/manga/{name}
  const [, chapter] = url.split("/").slice(-3);
  // console.log(tmp, chapter);

  const body = await res.text();

  // const regex =
  //   /https:\/\/hentai3z.com\/manga\/when-did-we-start-dating\/chapter-\d+\//g;

  const regex = new RegExp(
    `https:\/\/hentai3z.com\/manga\/${chapter}\/chapter-\\d+\/`,
    "g"
  );

  const matches = body.match(regex);
  if (!matches) {
    throw new Error("No chapter list found");
  }
  return matches.reverse();
}

async function getChapter(url: string) {
  const [tmp, chapter] = url.split("/").slice(-3);
  const rename = tmp.split("-").slice(0, -1).join("-");

  const regex = new RegExp(
    `https://img.hentai3z.com/${rename}/${chapter}/(\\d+)\\.jpg`,
    "g"
  );
  const name = tmp
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => {
      return word[0].toUpperCase() + word.slice(1);
    })
    // remove the last word
    .slice(0, -1)
    .join(" ");

  const res = await fetch(url);
  const body = await res.text();
  const matches = body.match(regex);
  if (!matches) {
    throw new Error("No images found");
  }
  if (!fs.existsSync("./images")) {
    fs.mkdirSync("./images");
  }
  // check if /images/{name} folder exists
  if (!fs.existsSync(`./images/${name}`)) {
    fs.mkdirSync(`./images/${name}`);
  }
  if (!fs.existsSync(`./images/${name}/${chapter}`)) {
    fs.mkdirSync(`./images/${name}/${chapter}`);
  }
  matches?.forEach((match) => {
    setTimeout(() => {
      const path = match.split("/").pop();
      // fetch ONLY the headers to get the content length
      fetch(match, { method: "HEAD" }).then((res) => {
        // if res status not 200, throw error
        if (res.status !== 200) {
          throw new Error("Image not found");
        }

        const contentLength = res.headers.get("content-length");
        if (contentLength) {
          const size = parseInt(contentLength);
          // console.log(`${match} ${size} bytes`);
          // check if file exists
          if (fs.existsSync(`./images/${name}/${chapter}/${path}`)) {
            const stats = fs.statSync(`./images/${name}/${chapter}/${path}`);
            if (stats.size === size) {
              // console.log("File already exists");
              return;
            }
          }
          fetch(match).then((res) => {
            console.log(`Downloading ${match}`);

            const dest = fs.createWriteStream(
              `./images/${name}/${chapter}/${path}`
            );
            res.body.pipe(dest);
          });
        }
      });
    }, 300 * matches.indexOf(match));
  });
}

async function main() {
  // const url = "https://hentai3z.com/manga/when-did-we-start-dating/";
  // const url = "https://hentai3z.com/manga/lucky-guy/";
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(e.red + "No url provided" + e.end);
    process.exit(1);
  }

  const tmp = url.split("/").at(-2);
  if (!tmp) {
    console.log(e.red + "Invalid url" + e.end);
    process.exit(1);
  }

  const name = tmp
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => {
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");
  console.log(name);

  // log above with no newline
  process.stdout.write(e.green + "Getting manga id... " + e.end);

  const id = await getChapterID(url);
  console.log("id: " + e.green + id + e.end);

  console.log(e.green + "Getting chapter list" + e.end);

  const chapters = await getChapterList(id, url);
  // console.log(chapters);
  console.log(e.green + "Chapters found: " + e.end + chapters.length);
  // console.log("Found " + e.green + chapters.length + e.end + " chapters");
  const res = await prompt("Download all chapters? (y/n) ");
  if (res.toLowerCase() === "y") {
    console.log("Downloading all chapters");
  } else {
    console.log(e.red + "Exiting" + e.end);
    process.exit(0);
  }
  // only download after chapter 212

  const start = 212;

  for (let i = start; i < chapters.length; i++) {
    const chapter = chapters[i];
    console.log(e.green + "Downloading chapter " + e.end + chapter);
    await getChapter(chapter);
  }

  // chapters.forEach((chapter) => {
  //   setTimeout(() => {
  //     console.log(chapter);

  //     getChapter(chapter);
  //   }, 10000 * chapters.indexOf(chapter));
  // });
  console.log(e.green + "Done" + e.end);
}

main();

// generate list of numbers
// const list = Array.from(Array(10).keys());

// list.forEach((num) => {
//   setTimeout(() => {
//     console.log(num);
//   }, 1000 * list.indexOf(num));
// });
