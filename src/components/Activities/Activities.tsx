import React from "react";
import Activity from "../Activity/Activity";
import type { ActivityProps } from "../Activity/Activity";

interface ActivitiesProps {
  response?: ActivityProps[];
}

const Activities = ({ response = [] }: ActivitiesProps) => {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {response.map((activity, index) => (
        <li key={`${activity.title}-${index}`}>
          <Activity {...activity} />
        </li>
      ))}
    </ul>
  );
};

export default Activities;
