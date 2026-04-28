import { Loader2 } from "lucide-react";

const Spinner = ({ text = "Loading..." }) => (
  <div className="spinner-wrapper">
    <Loader2 size={40} className="spinner-icon" />
    <p className="spinner-text">{text}</p>
  </div>
);

export default Spinner;
