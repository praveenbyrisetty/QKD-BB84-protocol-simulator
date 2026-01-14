// import React from "react";

// export default function ArchitecturePage() {
//   return (
//     <div className="page">
//       <h1>Architecture</h1>
//       <p>Here we explain the system architecture of AQH.</p>
//     </div>
//   );
// }
import React from "react";
import diagram1 from "../assets/bb84pic1.png";
import diagram2 from "../assets/bb84pic2.png";
import diagram3 from "../assets/bb84pic3.png";
import styles from "./arch.module.css";

export default function ArchitecturePage() {
  return (
    <div className="page" style={{
      backgroundColor : "rgb(30,43,43)"
    }}>
      <h1 className={styles.header}>System Architecture</h1>
      <p className={styles.sub}>Here are the key diagrams of the AQH project:</p>

      <div className={styles.gallery}>
        <div>
        <h1 style={{textAlign:"center",
          color: "#dce5ee"
        }}>quantum channel with out eve</h1><br></br>
        <img src={diagram1} className={styles.circuit} alt="Architecture Diagram 1" />
        </div>
        <div>
         <h1 style={{textAlign:"center",
          color: "#dce5ee"
         }}>quantum channel with eve</h1><br></br>
        <img src={diagram3} className={styles.circuit} alt="Architecture Diagram 2" />
        </div>
        <img src={diagram2} className={styles.circuit} alt="Architecture Diagram 3" />
      </div>
    </div>
  );
}

