import React, { useRef, useEffect } from 'react';

export default function Curve({ r0, r1, addToken0, addToken1, title0, title1, width, height }) {
  let ref = useRef(null);

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    let [dx, dy] = [x1 - x2, y1 - y2];
    let norm = Math.sqrt(dx * dx + dy * dy);
    let [udx, udy] = [dx / norm, dy / norm];
    const size = norm / 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size - udy * size, y2 + udx * size + udy * size);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size + udy * size, y2 - udx * size + udy * size);
    ctx.stroke();
  };

  useEffect(() => {
    let canvas = ref.current;
    const textSize = 12;

    const width = canvas.width;
    const height = canvas.height;

    if (canvas.getContext && r0 && r1) {
      const k = r0 * r1;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      let maxX = k / (r0 / 6);
      let minX = 10;

      if (addToken0 || addToken1) {
        maxX = k / (r0 * 0.2);
        //maxX = k/(r0*0.8)
        // minX = k / Math.max(1, 500 - r0);
      }

      const maxY = (maxX * height) / width;
      const minY = (minX * height) / width;

      const plotX = (x) => {
        return ((x - minX) / (maxX - minX)) * width;
      };

      const plotY = (y) => {
        return height - ((y - minY) / (maxY - minY)) * height;
      };
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#000000';
      ctx.font = textSize + 'px Arial';
      // +Y axis
      ctx.beginPath();
      ctx.moveTo(plotX(minX), plotY(0));
      ctx.lineTo(plotX(minX), plotY(maxY));
      ctx.stroke();
      // +X axis
      ctx.beginPath();
      ctx.moveTo(plotX(0), plotY(minY));
      ctx.lineTo(plotX(maxX), plotY(minY));
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (var x = minX; x <= maxX; x += maxX / width) {
        /////
        var y = k / x;
        /////
        if (first) {
          ctx.moveTo(plotX(x), plotY(y));
          first = false;
        } else {
          ctx.lineTo(plotX(x), plotY(y));
        }
      }
      ctx.stroke();

      ctx.lineWidth = 1;

      if (addToken0) {
        let newEthReserve = r0 + parseFloat(addToken0);

        ctx.fillStyle = '#bbbbbb';
        ctx.beginPath();
        ctx.arc(plotX(newEthReserve), plotY(k / newEthReserve), 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#009900';
        drawArrow(ctx, plotX(r0), plotY(r1), plotX(newEthReserve), plotY(r1));

        ctx.fillStyle = '#000000';
        ctx.fillText('' + addToken0 + title0 + ' input', plotX(r0) + textSize, plotY(r1) - textSize);

        ctx.strokeStyle = '#990000';
        drawArrow(ctx, plotX(newEthReserve), plotY(r1), plotX(newEthReserve), plotY(k / newEthReserve));

        let amountGained = Math.round((10000 * (addToken0 * r1)) / newEthReserve) / 10000;
        ctx.fillStyle = '#000000';
        ctx.fillText(
          '' + amountGained + title1 + ' output (-0.3% fee)',
          plotX(newEthReserve) + textSize,
          plotY(k / newEthReserve)
        );
      } else if (addToken1) {
        let newTokenReserve = r1 + parseFloat(addToken1);

        ctx.fillStyle = '#bbbbbb';
        ctx.beginPath();
        ctx.arc(plotX(k / newTokenReserve), plotY(newTokenReserve), 5, 0, 2 * Math.PI);
        ctx.fill();

        //console.log("newTokenReserve",newTokenReserve)
        ctx.strokeStyle = '#990000';
        drawArrow(ctx, plotX(r0), plotY(r1), plotX(r0), plotY(newTokenReserve));

        ctx.fillStyle = '#000000';
        ctx.fillText('' + addToken1 + title1 + ' input', plotX(r0) + textSize, plotY(r1));

        ctx.strokeStyle = '#009900';
        drawArrow(ctx, plotX(r0), plotY(newTokenReserve), plotX(k / newTokenReserve), plotY(newTokenReserve));

        let amountGained = Math.round((10000 * (addToken1 * r0)) / newTokenReserve) / 10000;
        //console.log("amountGained",amountGained)
        ctx.fillStyle = '#000000';
        ctx.fillText(
          '' + amountGained + title0 + ' output (-0.3% fee)',
          plotX(k / newTokenReserve) + textSize,
          plotY(newTokenReserve) - textSize
        );
      }

      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      ctx.arc(plotX(r0), plotY(r1), 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [r0, r1, addToken0, addToken1, title0, title1]);

  return (
    <div style={{ position: 'relative', width: width, height: height, margin: 'auto 0' }}>
      <canvas style={{ position: 'absolute', left: 0, top: 0 }} ref={ref} width={width} height={height} />
      <div style={{ position: 'absolute', left: '20%', bottom: -20 }}>{`-- ${title0} Reserve -->`}</div>
      <div
        style={{ position: 'absolute', left: -20, bottom: '20%', transform: 'rotate(-90deg)', transformOrigin: '0 0' }}
      >
        {`-- ${title1} Reserve -->`}
      </div>
    </div>
  );
}
