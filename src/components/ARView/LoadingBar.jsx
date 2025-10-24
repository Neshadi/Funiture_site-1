import React from "react";

const LoadingBar = ({ progress }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Loading bar container */}
      <div
        style={{
          width: "60%",
          height: "10px",
          backgroundColor: "#333",
          borderRadius: "5px",
          overflow: "hidden",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
            boxShadow: "0 0 15px #00aaff",
            borderRadius: "5px",
            transition: "width 0.25s ease-out",
          }}
        />
      </div>

      {/* Loading text */}
      <p
        style={{
          color: "#fff",
          fontSize: "16px",
          fontFamily: "sans-serif",
          marginTop: "12px",
          letterSpacing: "1px",
        }}
      >
        Loading... {progress}%
      </p>
    </div>
  );
};

export default LoadingBar;
