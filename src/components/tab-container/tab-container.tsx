"use client";

import { useState } from "react";

const TabContainer: React.FC<any> = ({ data, limit = false }) => {
  const tabs = limit
    ? Object.keys(data).filter((key) => limit.includes(key))
    : Object.keys(data);

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tab-container w-full">
      <ul className="tab-list flex w-full overflow-x-auto border-b mt-4">
        {tabs.map((tab, index) => (
          <li
            key={index}
            className={`tab-item cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === index
                ? "font-semibold border-denim-400"
                : "border-transparent"
            } px-4 py-2`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className="tab-content relative min-h-60">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`whitespace-pre-line p-4 ${
              activeTab === index ? "block" : "hidden"
            }`}
            dangerouslySetInnerHTML={{ __html: data[tab] || "" }}
          />
        ))}
      </div>
    </div>
  );
};

export default TabContainer;
