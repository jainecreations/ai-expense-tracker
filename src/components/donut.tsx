import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';


export default function Donut() {
  const chartDiameter = 200;
  const strokeWidth = 40;
  const radius = (chartDiameter - strokeWidth) / 2;


  const labelPadding = 120; // horizontal space for labels
  const verticalPadding = 120; // extra vertical space for top/bottom labels


  const svgWidth = chartDiameter + labelPadding * 2;
  const svgHeight = chartDiameter + verticalPadding * 2;


  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;


  const data = [
    { label: 'Food', value: 35, color: '#9ED6C2' },
    { label: 'Bills', value: 10, color: '#F9A77C' },
    { label: 'Shopping', value: 40, color: '#A7A5F9' },
    { label: 'Travel', value: 10, color: '#F9A77C' },
    { label: 'Misc', value: 5, color: '#B8B8F9' },
  ];


  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  const degToRad = deg => (deg * Math.PI) / 180;


  return (
    <View style={styles.container}>
      <Svg width={svgWidth} height={svgHeight}>
        <G rotation="0" origin={`${centerX}, ${centerY}`}>
          {data.map((slice, index) => {
            const sliceAngle = (slice.value / total) * 360;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(sliceAngle / 360) * circumference} ${circumference}`;


            // Draw slice
            const circle = (
              <Circle
                key={`slice-${index}`}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-(startAngle / 360) * circumference}
                fill="transparent"
              />
            );


            // Mid-angle for label line
            const midAngle = startAngle + sliceAngle / 2;
            const lineRadius = radius + strokeWidth / 2;
            const lineLength = 35;


            const x1 = centerX + lineRadius * Math.cos(degToRad(midAngle));
            const y1 = centerY + lineRadius * Math.sin(degToRad(midAngle));
            const x2 = centerX + (lineRadius + lineLength) * Math.cos(degToRad(midAngle));
            const y2 = centerY + (lineRadius + lineLength) * Math.sin(degToRad(midAngle));


            // Text anchor adjustment
            const textOffset = 5;
            let textAnchor = 'start';
            let dx = textOffset;
            if (midAngle > 90 && midAngle < 270) {
              textAnchor = 'end';
              dx = -textOffset;
            }


            startAngle += sliceAngle;


            return (
              <G key={`slice-group-${index}`}>
                {circle}
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={slice.color} strokeWidth={2} />
                <SvgText
                  x={x2 + dx}
                  y={y2}
                  fill="#333"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor={textAnchor}
                  alignmentBaseline="middle"
                >
                  {slice.label} ({slice.value}%)
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});