import { Button, Tag, Intent } from "@blueprintjs/core";
import { Card, CardActions, CardMedia } from "df/components/card";
import * as React from "react";

export default { title: "Components | Typography" };

export const Typography = () => (
  <>
    <h1>Header 1</h1>
    <h2>Header 2</h2>
    <h3>Header 3</h3>
    <h4>Header 4</h4>
    <p>
      Paragraph. Lorem ipsum dolor sit amet, consectetur <Tag>adipiscing</Tag> elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco <Tag intent={Intent.SUCCESS}>laboris</Tag> nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
      fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
      officia deserunt mollit anim id est laborum.
    </p>
  </>
);
