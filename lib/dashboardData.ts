

export const carbonTrendData = [
{ month: "T1", emissions: 2100, target: 2500 },
{ month: "T2", emissions: 2400, target: 2500 },
{ month: "T3", emissions: 2200, target: 2400 },
{ month: "T4", emissions: 1900, target: 2300 },
{ month: "T5", emissions: 2100, target: 2200 },
{ month: "T6", emissions: 1800, target: 2100 }];


export const emissionBreakdown = [
{ name: "chart.pie.material", value: 45, color: "hsl(150 60% 20%)" },
{ name: "chart.pie.manufacture", value: 25, color: "hsl(210 60% 40%)" },
{ name: "chart.pie.transport", value: 20, color: "hsl(35 70% 55%)" },
{ name: "chart.pie.package", value: 10, color: "hsl(280 60% 60%)" }];


export const marketReadiness = [
{ market: "EU", score: 78, status: "good" },
{ market: "US", score: 65, status: "warning" },
{ market: "JP", score: 82, status: "good" },
{ market: "KR", score: 71, status: "warning" }];


export const certificateList = [
{
  name: "certi1.name",
  status: "certi1.status",
  expires: "certi1.expires"
},
{
  name: "certi2.name",
  status: "certi2.status",
  expires: "certi2.expires"
},
{
  name: "certi3.name",
  status: "certi3.status",
  expires: null
},
{ name: "certi4.name", status: "certi4.status", expires: null }];


export const recommendations = [
{
  id: 1,
  title: "recommendations.rec1.title",
  description: "recommendations.rec1.subtitle",
  impact: "high",
  reduction: "15%"
},
{
  id: 2,
  title: "recommendations.rec2.title",
  description: "recommendations.rec2.subtitle",
  impact: "medium",
  reduction: "8%"
},
{
  id: 3,
  title: "recommendations.rec3.title",
  description: "recommendations.rec3.subtitle",
  impact: "low",
  reduction: "3%"
}];



export const getReadinessColor = (score: number) => {
  if (score >= 75) return "text-green-600 bg-green-100";
  if (score >= 50) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

export const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "bg-green-100 text-green-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};