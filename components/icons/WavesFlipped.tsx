import * as React from "react";
import { JSX } from "react/jsx-runtime";
const WavesFlipped = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>,
) => (
  <svg
    width="100%"
    height="100%"
    id="svg"
    viewBox="0 0 1440 690"
    xmlns="http://www.w3.org/2000/svg"
    className="transition duration-300 ease-in-out delay-150"
    {...props}
  >
    <defs>
      <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="5%" stopColor="#145233" />
        <stop offset="95%" stopColor="#173626" />
      </linearGradient>
    </defs>
    <path
      d="M 0,700 L 0,131 C 86.76153846153849,94.88076923076923 173.52307692307699,58.76153846153845 255,89 C 336.476923076923,119.23846153846155 412.6692307692307,215.8346153846154 487,242 C 561.3307692307693,268.1653846153846 633.8000000000001,223.90000000000003 709,254 C 784.1999999999999,284.09999999999997 862.1307692307691,388.5653846153846 953,418 C 1043.8692307692309,447.4346153846154 1147.6769230769232,401.83846153846156 1231,404 C 1314.3230769230768,406.16153846153844 1377.1615384615384,456.0807692307692 1440,506 L 1440,700 L 0,700 Z"
      stroke="none"
      strokeWidth={0}
      fill="url(#gradient)"
      fillOpacity={0.4}
      className="transition-all duration-300 ease-in-out delay-150 path-0"
      transform="rotate(-180 720 350)"
    />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="5%" stopColor="#145233" />
        <stop offset="95%" stopColor="#173626" />
      </linearGradient>
    </defs>
    <path
      d="M 0,700 L 0,306 C 71.55897435897435,304.1064102564103 143.1179487179487,302.21282051282054 214,314 C 284.8820512820513,325.78717948717946 355.0871794871796,351.25512820512813 438,384 C 520.9128205128204,416.74487179487187 616.5333333333334,456.76666666666677 715,498 C 813.4666666666666,539.2333333333332 914.7794871794872,581.678205128205 996,591 C 1077.2205128205128,600.321794871795 1138.3487179487179,576.5205128205129 1209,586 C 1279.6512820512821,595.4794871794871 1359.825641025641,638.2397435897435 1440,681 L 1440,700 L 0,700 Z"
      stroke="none"
      strokeWidth={0}
      fill="url(#gradient)"
      fillOpacity={0.53}
      className="transition-all duration-300 ease-in-out delay-150 path-1"
      transform="rotate(-180 720 350)"
    />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="5%" stopColor="#145233" />
        <stop offset="95%" stopColor="#173626" />
      </linearGradient>
    </defs>
    <path
      d="M 0,700 L 0,481 C 83.34358974358975,511.98846153846154 166.6871794871795,542.9769230769231 241,538 C 315.3128205128205,533.0230769230769 380.5948717948718,492.0807692307693 462,515 C 543.4051282051282,537.9192307692307 640.9333333333333,624.7 735,655 C 829.0666666666667,685.3 919.6717948717949,659.1192307692306 989,679 C 1058.3282051282051,698.8807692307694 1106.3794871794871,764.823076923077 1178,802 C 1249.6205128205129,839.176923076923 1344.8102564102564,847.5884615384615 1440,856 L 1440,700 L 0,700 Z"
      stroke="none"
      strokeWidth={0}
      fill="url(#gradient)"
      fillOpacity={1}
      className="transition-all duration-300 ease-in-out delay-150 path-2"
      transform="rotate(-180 720 350)"
    />
  </svg>
);
export default WavesFlipped;
