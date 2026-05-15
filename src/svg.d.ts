// svg.d.ts — SVGR default export is the React component (matches next.config / webpack)
declare module "*.svg" {
  import * as React from "react";
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
