import { Button } from "@blueprintjs/core";
import { Card, CardActions, CardMedia } from "df/components/card";
import * as React from "react";

export default { title: "Components | Cards" };

export const card = () => (
  <Card header="Title" headerRight={<Button text="Secondary action" />}>
    <p>All text inside cards should be in a paragraph.</p>
    <CardActions>
      <Button text="Action 1" />
      <Button text="Action 2" />
    </CardActions>
  </Card>
);

export const cardWithMedia = () => (
  <Card header="Title">
    <p>
      <code>CardMedia</code> components render to the edge of the card container, e.g. for images.
    </p>
    <CardMedia style={{ height: "200px", backgroundColor: "grey" }} />
  </Card>
);
