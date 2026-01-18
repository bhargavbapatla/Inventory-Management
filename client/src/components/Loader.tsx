export default function Loader() {

   return (
    <>
      <style>{`
        .banter-loader {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 72px;
          height: 72px;
          margin-left: -36px;
          margin-top: -36px;
        }

        .banter-loader__box {
          float: left;
          position: relative;
          width: 20px;
          height: 20px;
          margin-right: 6px;
        }

        .banter-loader__box::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #fff;
        }

        .banter-loader__box:nth-child(3n) {
          margin-right: 0;
          margin-bottom: 6px;
        }

        .banter-loader__box:nth-child(1)::before,
        .banter-loader__box:nth-child(4)::before {
          margin-left: 26px;
        }

        .banter-loader__box:nth-child(3)::before {
          margin-top: 52px;
        }

        .banter-loader__box:last-child {
          margin-bottom: 0;
        }

        @keyframes moveBox-1 {
          9.09% { transform: translate(-26px, 0); }
          18.18% { transform: translate(0, 0); }
          36.36% { transform: translate(26px, 0); }
          45.45%, 63.63% { transform: translate(26px, 26px); }
          72.72% { transform: translate(26px, 0); }
          90.9% { transform: translate(-26px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-2 {
          18.18% { transform: translate(26px, 0); }
          36.36% { transform: translate(26px, 0); }
          45.45%, 72.72% { transform: translate(26px, 26px); }
          81.81% { transform: translate(0, 26px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-3 {
          9.09%, 72.72% { transform: translate(-26px, 0); }
          81.81% { transform: translate(-26px, -26px); }
          90.9% { transform: translate(0, -26px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-4 {
          27.27% { transform: translate(-26px, -26px); }
          36.36% { transform: translate(0, -26px); }
          54.54%, 72.72% { transform: translate(0, -26px); }
          81.81% { transform: translate(-26px, -26px); }
          90.9% { transform: translate(-26px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-5 {
          36.36%, 72.72% { transform: translate(26px, 0); }
          81.81% { transform: translate(26px, -26px); }
          90.9% { transform: translate(0, -26px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-6 {
          18.18% { transform: translate(-26px, 0); }
          72.72% { transform: translate(0, 26px); }
          81.81% { transform: translate(-26px, 26px); }
          90.9% { transform: translate(-26px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-7 {
          9.09%, 27.27% { transform: translate(26px, 0); }
          45.45% { transform: translate(0, -26px); }
          54.54% { transform: translate(26px, -26px); }
          72.72% { transform: translate(0, -26px); }
          90.9% { transform: translate(26px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-8 {
          18.18% { transform: translate(-26px, 0); }
          27.27% { transform: translate(-26px, -26px); }
          72.72% { transform: translate(0, -26px); }
          81.81% { transform: translate(26px, -26px); }
          90.9% { transform: translate(26px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes moveBox-9 {
          9.09%, 72.72% { transform: translate(-26px, 0); }
          81.81% { transform: translate(-52px, 0); }
          90.9% { transform: translate(-26px, 0); }
          100% { transform: translate(0, 0); }
        }

        .banter-loader__box:nth-child(1) { animation: moveBox-1 4s infinite; }
        .banter-loader__box:nth-child(2) { animation: moveBox-2 4s infinite; }
        .banter-loader__box:nth-child(3) { animation: moveBox-3 4s infinite; }
        .banter-loader__box:nth-child(4) { animation: moveBox-4 4s infinite; }
        .banter-loader__box:nth-child(5) { animation: moveBox-5 4s infinite; }
        .banter-loader__box:nth-child(6) { animation: moveBox-6 4s infinite; }
        .banter-loader__box:nth-child(7) { animation: moveBox-7 4s infinite; }
        .banter-loader__box:nth-child(8) { animation: moveBox-8 4s infinite; }
        .banter-loader__box:nth-child(9) { animation: moveBox-9 4s infinite; }
      `}</style>

      <div className="banter-loader">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="banter-loader__box" />
        ))}
      </div>
    </>
  );
}
