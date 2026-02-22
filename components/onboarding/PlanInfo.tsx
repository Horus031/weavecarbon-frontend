import React from "react";

const PlanInfo = () => {
  return (
    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Starter Plan</p>
          <p className="text-sm text-muted-foreground">
            Free trial to get you started
          </p>
        </div>
        <span className="text-lg font-bold text-primary">149k - 299k VNĐ</span>
      </div>
    </div>);

};

export default PlanInfo;