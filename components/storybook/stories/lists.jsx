import { Intent, Tag, Button, Icon } from "@blueprintjs/core";
import { List, ListItem } from "df/components/list";
import * as React from "react";

export default { title: "Components | Lists" };

export const list = () => (
  <List>
    <ListItem left={<b>Bold left</b>} right={<Tag intent={"success"}>Tag</Tag>} />
    <ListItem left={"Left"} right={<Button text="Button" />} />
    <ListItem
      left={
        <>
          <Icon icon="help" />
          <b>With icon and title</b>
        </>
      }
    />
  </List>
);
