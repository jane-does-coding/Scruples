export const FONT_STORAGE_KEY = "scruples-font";
export const FONT_CLASS = "readable-font";

export const FONT_SCRIPT = `try{localStorage.getItem("${FONT_STORAGE_KEY}")==="readable"&&document.documentElement.classList.add("${FONT_CLASS}")}catch(e){}`;
