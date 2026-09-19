import ReportForm from "../components/ReportForm";

export default function ReportFound() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Report a found item</h1>
        <p>Thanks for looking out for someone else's stuff — a few details helps us find them.</p>
      </div>
      <ReportForm type="found" />
    </div>
  );
}
