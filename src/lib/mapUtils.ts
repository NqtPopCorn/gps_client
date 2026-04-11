// // src/utils/mapUtils.ts

// // Hàm chuyển đổi Kinh độ (Longitude) sang X
// function lon2tile(lon: number, zoom: number): number {
//   return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
// }

// // Hàm chuyển đổi Vĩ độ (Latitude) sang Y
// function lat2tile(lat: number, zoom: number): number {
//   return Math.floor(
//     ((1 -
//       Math.log(
//         Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
//       ) /
//         Math.PI) /
//       2) *
//       Math.pow(2, zoom),
//   );
// }

// /**
//  * Lấy danh sách URL của các map tiles bao trùm một khu vực (Bounding Box)
//  */
// export function getMapTileUrls(
//   minLat: number,
//   minLon: number,
//   maxLat: number,
//   maxLon: number,
//   minZoom: number,
//   maxZoom: number,
//   // Đổi URL này theo Tile Server bạn đang dùng trong Leaflet
//   tileServerTemplate = "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
// ): string[] {
//   const urls: string[] = [];

//   for (let z = minZoom; z <= maxZoom; z++) {
//     const xMin = lon2tile(minLon, z);
//     const xMax = lon2tile(maxLon, z);
//     const yMin = lat2tile(maxLat, z); // Lưu ý: maxLat sinh ra yMin (do trục Y úp ngược)
//     const yMax = lat2tile(minLat, z);

//     for (let x = xMin; x <= xMax; x++) {
//       for (let y = yMin; y <= yMax; y++) {
//         const url = tileServerTemplate
//           .replace("{z}", z.toString())
//           .replace("{x}", x.toString())
//           .replace("{y}", y.toString());
//         urls.push(url);
//       }
//     }
//   }

//   return urls;
// }
