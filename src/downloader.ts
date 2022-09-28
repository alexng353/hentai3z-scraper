import fetch from "node-fetch";
import fs from "fs";
function getChapter(url: string) {
  // create regex for src=https://img.hentai3z.com/a-perverts-daily-life/chapter-1/{number}.jpg

  const [tmp, chapter] = url.split("/").slice(-3);
  // const regex =
  //   /https:\/\/img\.hentai3z\.com\/a-perverts-daily-life\/${chapter}\/(\d+)\.jpg/g;
  const regex = new RegExp(
    `https://img.hentai3z.com/${tmp}/${chapter}/(\\d+)\\.jpg`,
    "g"
  );

  // capitalize with normal english capitalization rules
  const name = tmp
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => {
      return word[0].toUpperCase() + word.slice(1);
    })
    // remove last item in array
    .slice(0, -1)
    .join(" ");

  fetch(url)
    .then((res) => res.text())
    .then((body) => {
      const matches = body.match(regex);
      // console.log(matches);
      // check if /images folder exists
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
        // fetch(match).then((res) => {
        //   const path = match.split("/").pop();
        //   const dest = fs.createWriteStream(
        //     `./images/${name}/${chapter}/${path}`
        //   );
        //   res.body.pipe(dest);
        // });
        // check if file exists, if not, download
        const path = match.split("/").pop();
        if (!fs.existsSync(`./images/${name}/${chapter}/${path}`)) {
          console.log(`Downloading ${match}`);
          fetch(match).then((res) => {
            const dest = fs.createWriteStream(
              `./images/${name}/${chapter}/${path}`
            );
            res.body.pipe(dest);
          });
        }
      });
    });
}

// getChapter("https://hentai3z.com/manga/a-perverts-daily-life-11/chapter-2/");
const url = "https://hentai3z.com/manga/lucky-guy/";
const first = 1;
const last = 73;

const urls = Array.from({ length: last - first + 1 }, (_, i) => i + first).map(
  (i) => `${url}chapter-${i}/`
);

// start =0, stop =5
const urls2 = [124, 43, 51];

function main() {
  urls.forEach((url) => {
    // wait 5 seconds before starting next download
    setTimeout(() => {
      // console.log(urls[url]);
      getChapter(url);
    }, 5000 * urls.indexOf(url));
  });
}

main();

// urls2.forEach((url3) => {
//   // getChapter(url + `chapter-${url3}/`);
// });

// read all folders in ./images/A Perverts Daily Life/ and find which ones do not have any files in them
// if there are no files in the folder, print the folder name

// fs.readdir("./images/A Perverts Daily Life/", (err, files) => {
//   files.forEach((file) => {
//     fs.readdir(`./images/A Perverts Daily Life/${file}`, (err, files) => {
//       if (files.length === 0) {
//         console.log(file);
//       }
//     });
//   });
// });
