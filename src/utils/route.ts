const RouteNames: { [key: string]: string } = {
  home: "首頁",
  about: "關於計畫",
  courses: "師培/專業課程",
  expertise: "科技領域專長",
  activity: "活動資訊",
  partner: "夥伴聯盟",
};

export const GetNameByRoute = (route: string) => {
  return RouteNames[route] || null;
};
