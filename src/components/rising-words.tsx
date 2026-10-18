import { Fragment } from "react";

export const RisingWords = ({
  text,
  from = 0,
}: {
  text: string;
  from?: number;
}) =>
  [...text.matchAll(/\S+/gu)].map((match, order) => (
    <Fragment key={match.index}>
      {order > 0 ? " " : null}
      <span className="word-in" style={{ "--i": from + order }}>
        {match[0]}
      </span>
    </Fragment>
  ));
