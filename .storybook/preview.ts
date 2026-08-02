import type { Preview } from "@storybook/react-vite";
import "../packages/ui/src/styles.css";
import "./storybook.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    layout: "centered",
    viewport: {
      options: {
        mobile320: { name: "Mobile 320", styles: { width: "320px", height: "568px" } },
        mobile390: { name: "Mobile 390", styles: { width: "390px", height: "844px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
      },
    },
  },
};
export default preview;
