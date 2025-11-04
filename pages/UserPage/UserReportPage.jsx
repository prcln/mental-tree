import EmotionReports from "../../components/EmotionReport/EmotionReport"
import { useParams } from "react-router-dom"

export const UserReportPage = () => {
  const { treeId } = useParams();
  
  return (
    <div className="page-with-header">
      <EmotionReports treeId={treeId} />
    </div>
  )
}