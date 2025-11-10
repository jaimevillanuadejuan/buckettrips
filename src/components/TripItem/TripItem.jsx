import "./TripItem.scss";
import Activities from "../Activities/Activities";
const TripItem = ({ response }) => {
  return (
    <div className="wrapper">
      <Activities response={response} />
    </div>
  );
};

export default TripItem;
