import ReportForm from "../components/ReportForm";

export default function ReportLost() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Report a lost item</h1>
        <p>Fill in as much detail as you can — it helps us match it to a found report faster.</p>
      </div>
      <ReportForm type="lost" />
    </div>
  );
}
