const { ipcRenderer } = require("electron");
const pup = require("puppeteer");
// const Store = require("electron-store");

//Enter 이벤트 등록
function getUrlInput() {
  let url = document.getElementById("url").value;
  return url;
}
function toggleCancel() {
  console.log("cancel");
}
function onPress() {
  if (event.key == "Enter") {
    onSubmit();
  }
}
async function configureBrowser(url) {
  const browser = await pup.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  return page;
}
async function parsing(page) {
  let html = await page.evaluate(() => {
    let q = [];
    let ls = document.querySelectorAll(".list-pd");
    let source = document.querySelector("title").innerText;
    let auctionTitle = document.querySelector(".subtop-desc > h1").innerText;
    ls.forEach((item) => {
      const mainInfo = item.querySelector(".card.artwork");
      const number =
        mainInfo.querySelector(".lot").innerText.split("LOT ")[1] || "";
      const artist = mainInfo.querySelector(".card-title").innerText || "";
      const title = mainInfo.querySelector(".card-subtitle").innerText || "";
      const description =
        mainInfo.querySelector(".description").innerText || "";
      const yearMaterial = description.split("\n")[0];
      const year = yearMaterial.replace(/[^0-9]/g, "").trim();
      const material = yearMaterial.replace(/[0-9]/g, "").trim();
      const sizeEdition = description.split("\n")[1];
      const estimate =
        mainInfo
          .querySelector(".list-inline-item.font-numbers")
          .innerText.replace("\n", " ") || "";

      const artistKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";
      const artistEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";

      const titleKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";
      const titleEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";

      const materialKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";
      const materialEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";

      const certi = "";
      const signPosition = "";
      const transactDate = "";
      const winningBid = "";
      q.push({
        number,
        artistKr,
        artistEn,
        titleKr,
        titleEn,
        year,
        certi,
        sizeEdition,
        materialKr,
        materialEn,
        signPosition,
        estimate,
        source,
        auctionTitle,
        transactDate,
        winningBid,
      });
    });
    return q;
  });
  return html;
}

async function scraper(url) {
  let finalItems = [];
  let page = await configureBrowser(url);
  let items = await page.$$(".paginate_button.page-item");
  let i = 2;
  while (i < items.length) {
    console.log("파싱실행", i);
    let artworks = await parsing(page);
    const tbody = document.getElementById("tbody");
    // if (tbody.hasChildNodes()) {}

    console.log(artworks);
    artworks.forEach((el) => {
      tbody.innerHTML += `
        <tr>
            <td>${el.number}</td>
            <td>${el.artistKr}</td>
            <td>${el.artistEn}</td>
            <td>${el.titleKr}</td>
            <td>${el.titleEn}</td>
            <td>${el.year}</td>
            <td>${el.certi}</td>
            <td>${el.sizeEdition}</td>
            <td>${el.materialKr}</td>
            <td>${el.materialEn}</td>
            <td>${el.signPosition}</td>
            <td>${el.estimate}</td>
            <td>${el.source}</td>
            <td>${el.auctionTitle}</td>
            <td>${el.transactDate}</td>
            <td>${el.winningBid}</td> 
        </tr>
    `;
      // event.sender.send("bar", res);
      // jsonToXlsx.write("test.xlsx", "testSheet", res);
    });
    finalItems.push(...artworks);

    //pagination part
    let el = await page.$(
      ".paginate_button.page-item:nth-child(" + (i + 2) + ")"
    );
    if (el) {
      console.log("다음페이지클릭");
      el.click();
      console.log("렌더링 대기");
      await page.waitForSelector(".card");
      await page.waitForTimeout(500);
      i += 1;
    } else {
      console.log(`${i - 1}개의 페이지네이션 종료`);
      break;
    }
  }
  return finalItems;
}

function onSubmit() {
  let url = getUrlInput();
  scraper(url).then((res) => {
    console.log(res);
  });
}
