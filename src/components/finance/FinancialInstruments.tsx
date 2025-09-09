
import { useState } from "react";
import InstrumentSummary from "./financial-instruments/InstrumentSummary";
import InstrumentActions from "./financial-instruments/InstrumentActions";
import InstrumentList from "./financial-instruments/InstrumentList";

const FinancialInstruments = () => {
  const [selectedType, setSelectedType] = useState("all");
  
  return (
    <div className="grid gap-4">
      <InstrumentSummary />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <InstrumentActions 
          selectedType={selectedType} 
          setSelectedType={setSelectedType} 
        />
        <InstrumentList />
      </div>
    </div>
  );
};

export default FinancialInstruments;
