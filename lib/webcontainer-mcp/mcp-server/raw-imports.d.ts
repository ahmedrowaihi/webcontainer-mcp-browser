declare module '*.json?raw' {
  const content: string;
  export default content;
}
declare module '*.js?raw' {
  const content: string;
  export default content;
} 

// DO NOT FORGET TO ADJUST next.config.mjs TO INCLUDE THESE FILES :)