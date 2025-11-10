import React from "react";
import Activity from "../Activity/Activity";

import "./Activities.scss";
const Activities = ({ response }) => {
  console.log(response);
  return (
    <ul className="activities">
      {response !== undefined && response.length > 0
        ? response.map((activity, index) => (
            <Activity key={index} activity={activity} />
          ))
        : ""}
    </ul>
  );
};

export default Activities;
