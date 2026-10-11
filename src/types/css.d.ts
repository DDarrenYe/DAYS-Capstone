import "react";

/* Custom properties carry dynamic values into classes such as h-(--h) and the stagger utility. */
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number;
  }
}
