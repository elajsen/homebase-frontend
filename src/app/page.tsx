import Modal from "@/components/homepage/modal";
import React from "react";

const styles: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
};

const Home: React.FC = () => {
    return (
      <div style={styles}>
        <Modal title="Monthly Budget" link="/monthly_budget"/>
        <Modal title="Month by Month" link="/month_by_month"/>
        <Modal title="Yearly Overview" link="/"/>
      </div>
    );
  };
  
  export default Home;
  