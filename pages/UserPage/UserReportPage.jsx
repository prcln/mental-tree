import EmotionReports from "../../components/EmotionReport/EmotionReport"
import { useParams } from "react-router-dom"

export const UserReportPage = () => {
  const { treeId } = useParams();
   console.log('treeId:', treeId, 'type:', typeof treeId);
  return (
    <EmotionReports treeId={treeId} />
  )
}