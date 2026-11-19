fetch("https://fatew.com/", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "content-type": "application/x-www-form-urlencoded",
    "priority": "u=0, i",
    "upgrade-insecure-requests": "1",
    "cookie": "_ga=GA1.1.1463928472.1794450887; __gads=ID=25ef7ed5301b7554:T=1794450888:RT=1794450888:S=ALNI_MbuUYKEjkcFizCNTf_s_ouF7hSbqg; __gpi=UID=000015d89537ead3:T=1794450888:RT=1794450888:S=ALNI_MYE7lVlLpsTJoeQLYmn0JJ0bh7PVg; __eoi=ID=336d536fb5730587:T=1794450888:RT=1794450888:S=AA-AfjZ0qZvF7nzIujWinv6EE3eY; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%22cb53857a-a026-4dc2-8518-999b9577c5ee%5C%22%2C%5B1794450888%2C628000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol-dvO1_fq_DI4HJcFpOGaLSa9RjZGv9_POxzY6w6af2l_JUMQYT9zL5PGzgSruCCdLsFzUh9uNQadG2YlDXQ0GL6evwFg%3D%3D%22%5D%5D; _ga_49QDVE8PXW=GS2.1.s1794450887$o1$g1$t1794450979$j32$l0$h0",
    "Referer": "https://fatew.com/"
  },
  "body": "hityear=1984&hitmonth=06&hitday=17&hittime=17&hitminute=30&city=0&gender=1",
  "method": "POST"
});


const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

const urlencoded = new URLSearchParams();
urlencoded.append("hityear", "1964");
urlencoded.append("hitmonth", "04");
urlencoded.append("hitday", "07");
urlencoded.append("hittime", "00");
urlencoded.append("hitminute", "30");
urlencoded.append("city", "0");
urlencoded.append("gender", "0");

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: urlencoded,
  redirect: "follow"
};

fetch("https://fatew.com/", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));




  // --- nodejs axios example ---
  const axios = require('axios');
const qs = require('qs');
let data = qs.stringify({
  'hityear': '1964',
  'hitmonth': '04',
  'hitday': '07',
  'hittime': '00',
  'hitminute': '30',
  'city': '0',
  'gender': '0' 
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://fatew.com/',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
