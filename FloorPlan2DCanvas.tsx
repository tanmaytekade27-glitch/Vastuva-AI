import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileText,
  RefreshCw,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { BudgetResult, FloorPlanResult, PlacedRoom, ProjectInput } from '../types/vastuva';
import { formatINR } from '../engine/budgetCalculator';

interface FloorPlan2DCanvasProps {
  plan: FloorPlanResult;
  input: ProjectInput;
  budget: BudgetResult;
  activeFloorIndex: number;
  onSelectFloor: (idx: number) => void;
  onRegenerateLayout: () => void;
}

export const FloorPlan2DCanvas: React.FC<FloorPlan2DCanvasProps> = ({
  plan,
  input,
  budget,
  activeFloorIndex,
  onSelectFloor,
  onRegenerateLayout,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const safeFloorIdx = Math.min(activeFloorIndex, Math.max(0, plan.floors.length - 1));
  const currentFloor = plan.floors[safeFloorIdx] || plan.floors[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFloor) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = canvas.clientWidth || 840;
    const displayH = canvas.clientHeight || 540;
    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Ivory Drafting Paper Background
    ctx.fillStyle = '#FBF9F5';
    ctx.fillRect(0, 0, displayW, displayH);

    // Subtle Drafting Grid
    ctx.strokeStyle = 'rgba(23, 43, 54, 0.045)';
    ctx.lineWidth = 1;
    const gridStep = 24;
    for (let gx = 0; gx < displayW; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, displayH);
      ctx.stroke();
    }
    for (let gy = 0; gy < displayH; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(displayW, gy);
      ctx.stroke();
    }

    // Compute world-to-screen scale
    const pad = 74;
    const availW = displayW - pad * 2;
    const availH = displayH - pad * 2;
    const baseScale = Math.min(availW / plan.plotWidthFt, availH / plan.plotLengthFt);
    const pxPerFt = baseScale * zoom;

    const drawW = plan.plotWidthFt * pxPerFt;
    const drawH = plan.plotLengthFt * pxPerFt;
    const originX = (displayW - drawW) * 0.5 + pan.x;
    const originY = (displayH - drawH) * 0.5 + pan.y;

    const toX = (ftX: number) => originX + ftX * pxPerFt;
    const toY = (ftY: number) => originY + ftY * pxPerFt;

    // 1. Plot Boundary (Dashed Property Line)
    ctx.save();
    ctx.strokeStyle = '#667C70';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(originX, originY, drawW, drawH);
    ctx.restore();

    // Road Frontage Indicator Strip at bottom
    const roadY = originY + drawH + 10;
    ctx.fillStyle = 'rgba(23, 43, 54, 0.08)';
    ctx.fillRect(originX, roadY, drawW, 18);
    ctx.fillStyle = '#172B36';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `FRONT ROAD (${input.plot.roadWidthFt} FT WIDE · ${input.plot.facing.toUpperCase()} FACING)`,
      originX + drawW * 0.5,
      roadY + 9
    );

    // 2. Render Exterior Zones (Garden, Parking, Balcony, Terrace)
    currentFloor.rooms
      .filter((r) => r.isExteriorZone)
      .forEach((room) => {
        const rx = toX(room.x);
        const ry = toY(room.y);
        const rw = room.width * pxPerFt;
        const rh = room.height * pxPerFt;

        ctx.fillStyle = room.color;
        ctx.fillRect(rx, ry, rw, rh);

        ctx.save();
        ctx.strokeStyle = room.category === 'garden' ? '#667C70' : '#9F7840';
        ctx.lineWidth = 1.25;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();

        // Car silhouette in parking bay
        if (room.category === 'parking' && rw > 34 && rh > 28) {
          ctx.save();
          ctx.strokeStyle = 'rgba(23, 43, 54, 0.45)';
          ctx.lineWidth = 1.2;
          const cw = Math.min(rw * 0.65, 6 * pxPerFt);
          const ch = Math.min(rh * 0.72, 11 * pxPerFt);
          const cx = rx + (rw - cw) * 0.5;
          const cy = ry + (rh - ch) * 0.5;
          ctx.strokeRect(cx, cy, cw, ch);
          ctx.strokeRect(cx + cw * 0.14, cy + ch * 0.22, cw * 0.72, ch * 0.52);
          ctx.restore();
        }

        // Garden botanical circles
        if (room.category === 'garden' && rw > 30 && rh > 20) {
          ctx.save();
          ctx.fillStyle = 'rgba(102, 124, 112, 0.35)';
          const rDot = Math.max(4, Math.min(10, Math.min(rw, rh) * 0.2));
          ctx.beginPath();
          ctx.arc(rx + rw * 0.22, ry + rh * 0.5, rDot, 0, Math.PI * 2);
          ctx.arc(rx + rw * 0.78, ry + rh * 0.5, rDot, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (rw > 34 && rh > 20) {
          ctx.save();
          const compactLabel =
            rw < 90
              ? room.category === 'parking'
                ? 'PARKING'
                : room.category === 'garden'
                  ? 'GARDEN'
                  : room.category === 'balcony'
                    ? 'BALCONY'
                    : room.category === 'terrace'
                      ? 'TERRACE'
                      : room.name.toUpperCase()
              : room.name.toUpperCase();
          ctx.fillStyle = '#172B36';
          ctx.font = '600 9.5px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(compactLabel, rx + rw * 0.5, ry + rh * 0.5 - 5, rw - 10);
          ctx.font = '500 8.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#50646E';
          ctx.fillText(
            `${room.width.toFixed(1)}' × ${room.height.toFixed(1)}'`,
            rx + rw * 0.5,
            ry + rh * 0.5 + 7,
            rw - 10
          );
          ctx.restore();
        }
      });

    // 3. Render Interior Rooms (Background Fills + Staircase Treads)
    const interiorRooms = currentFloor.rooms.filter((r) => !r.isExteriorZone);
    interiorRooms.forEach((room) => {
      const rx = toX(room.x);
      const ry = toY(room.y);
      const rw = room.width * pxPerFt;
      const rh = room.height * pxPerFt;

      ctx.fillStyle = room.color;
      ctx.fillRect(rx, ry, rw, rh);

      // Staircase Treads & UP Arrow
      if (room.category === 'staircase') {
        ctx.save();
        ctx.strokeStyle = 'rgba(23, 43, 54, 0.45)';
        ctx.lineWidth = 1;
        const steps = 9;
        const stepH = rh / steps;
        for (let s = 1; s < steps; s++) {
          ctx.beginPath();
          ctx.moveTo(rx, ry + s * stepH);
          ctx.lineTo(rx + rw, ry + s * stepH);
          ctx.stroke();
        }
        // Center flight line + UP arrow
        ctx.strokeStyle = '#9F7840';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(rx + rw * 0.5, ry + rh * 0.85);
        ctx.lineTo(rx + rw * 0.5, ry + rh * 0.15);
        ctx.lineTo(rx + rw * 0.5 - 5, ry + rh * 0.15 + 6);
        ctx.moveTo(rx + rw * 0.5, ry + rh * 0.15);
        ctx.lineTo(rx + rw * 0.5 + 5, ry + rh * 0.15 + 6);
        ctx.stroke();
        ctx.restore();
      }

      // Lift X symbol
      if (room.category === 'lift') {
        ctx.save();
        ctx.strokeStyle = 'rgba(23, 43, 54, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx + 4, ry + 4);
        ctx.lineTo(rx + rw - 4, ry + rh - 4);
        ctx.moveTo(rx + rw - 4, ry + 4);
        ctx.lineTo(rx + 4, ry + rh - 4);
        ctx.stroke();
        ctx.restore();
      }
    });

    // 4. Interior Partition Walls
    ctx.strokeStyle = '#172B36';
    ctx.lineWidth = Math.max(2, 0.35 * pxPerFt);
    interiorRooms.forEach((room) => {
      ctx.strokeRect(
        toX(room.x),
        toY(room.y),
        room.width * pxPerFt,
        room.height * pxPerFt
      );
    });

    // 5. Outer Structural Wall Perimeter (Thick Architectural Wall)
    const fx = toX(currentFloor.footprintX);
    const fy = toY(currentFloor.footprintY);
    const fw = currentFloor.footprintWidth * pxPerFt;
    const fh = currentFloor.footprintHeight * pxPerFt;

    ctx.strokeStyle = '#172B36';
    ctx.lineWidth = Math.max(4.5, 0.65 * pxPerFt);
    ctx.strokeRect(fx, fy, fw, fh);

    // 6. Doors (with Swing Arcs) & Exterior Windows
    interiorRooms.forEach((room) => {
      // Doors
      room.doors.forEach((door) => {
        const dx = toX(door.x);
        const dy = toY(door.y);
        const dw = door.widthFt * pxPerFt;
        ctx.save();
        // Clear wall opening
        ctx.strokeStyle = room.color;
        ctx.lineWidth = Math.max(5, 0.7 * pxPerFt);
        ctx.beginPath();
        if (door.wall === 'top' || door.wall === 'bottom') {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx + dw, dy);
        } else {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx, dy + dw);
        }
        ctx.stroke();

        // Door leaf & quarter arc in Royal Gold / Midnight
        ctx.strokeStyle = '#9F7840';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (door.wall === 'bottom') {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx, dy - dw);
          ctx.arc(dx, dy, dw, -Math.PI / 2, 0, false);
        } else if (door.wall === 'top') {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx, dy + dw);
          ctx.arc(dx, dy, dw, 0, Math.PI / 2, false);
        } else if (door.wall === 'left') {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx + dw, dy);
          ctx.arc(dx, dy, dw, 0, Math.PI / 2, false);
        } else {
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx - dw, dy);
          ctx.arc(dx, dy, dw, Math.PI / 2, Math.PI, false);
        }
        ctx.stroke();
        ctx.restore();
      });

      // Windows (Double-line Glazing Symbol)
      room.windows.forEach((win) => {
        const wx = toX(win.x);
        const wy = toY(win.y);
        const ww = win.widthFt * pxPerFt;
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(4, 0.55 * pxPerFt);
        ctx.beginPath();
        if (win.wall === 'top' || win.wall === 'bottom') {
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + ww, wy);
        } else {
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx, wy + ww);
        }
        ctx.stroke();

        ctx.strokeStyle = '#387780';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (win.wall === 'top' || win.wall === 'bottom') {
          ctx.moveTo(wx, wy - 2);
          ctx.lineTo(wx + ww, wy - 2);
          ctx.moveTo(wx, wy + 2);
          ctx.lineTo(wx + ww, wy + 2);
        } else {
          ctx.moveTo(wx - 2, wy);
          ctx.lineTo(wx - 2, wy + ww);
          ctx.moveTo(wx + 2, wy);
          ctx.lineTo(wx + 2, wy + ww);
        }
        ctx.stroke();
        ctx.restore();
      });
    });

    // 7. Room Labels & Dimensions
    interiorRooms.forEach((room: PlacedRoom) => {
      const rx = toX(room.x);
      const ry = toY(room.y);
      const rw = room.width * pxPerFt;
      const rh = room.height * pxPerFt;
      const cx = rx + rw * 0.5;
      const cy = ry + rh * 0.5;

      if (rw < 28 || rh < 24) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = Math.max(8, Math.min(11, rw * 0.105));
      const shortName =
        rw < 64 && room.name.length > 10 ? room.name.split(' ')[0].toUpperCase() : room.name.toUpperCase();

      if (room.category === 'staircase') {
        const boxW = Math.min(rw - 6, 56);
        ctx.fillStyle = 'rgba(251, 249, 245, 0.88)';
        ctx.fillRect(cx - boxW * 0.5, cy - 13, boxW, 26);
      }

      ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#172B36';
      ctx.fillText(shortName, cx, cy - 6, rw - 10);

      ctx.font = `500 ${Math.max(7.5, fontSize - 1.5)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#50646E';
      ctx.fillText(
        `${room.width.toFixed(1)}' × ${room.height.toFixed(1)}'`,
        cx,
        cy + 7,
        rw - 10
      );
      ctx.restore();
    });

    // 8. Architectural Outer Dimension Lines (Top & Left)
    ctx.save();
    ctx.strokeStyle = '#172B36';
    ctx.fillStyle = '#172B36';
    ctx.lineWidth = 1;
    ctx.font = '600 10px "JetBrains Mono", monospace';

    // Top Plot Width dimension line
    const dimTopY = originY - 18;
    ctx.beginPath();
    ctx.moveTo(originX, dimTopY);
    ctx.lineTo(originX + drawW, dimTopY);
    ctx.moveTo(originX, dimTopY - 5);
    ctx.lineTo(originX, dimTopY + 5);
    ctx.moveTo(originX + drawW, dimTopY - 5);
    ctx.lineTo(originX + drawW, dimTopY + 5);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(`${plan.plotWidthFt} FT (PLOT WIDTH)`, originX + drawW * 0.5, dimTopY - 8);

    // Left Plot Length dimension line
    const dimLeftX = originX - 20;
    ctx.beginPath();
    ctx.moveTo(dimLeftX, originY);
    ctx.lineTo(dimLeftX, originY + drawH);
    ctx.moveTo(dimLeftX - 5, originY);
    ctx.lineTo(dimLeftX + 5, originY);
    ctx.moveTo(dimLeftX - 5, originY + drawH);
    ctx.lineTo(dimLeftX + 5, originY + drawH);
    ctx.stroke();

    ctx.translate(dimLeftX - 10, originY + drawH * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${plan.plotLengthFt} FT (PLOT LENGTH)`, 0, 0);
    ctx.restore();

    // 9. North-Direction Architectural Compass (Top-Right Sheet Corner)
    const compX = displayW - 48;
    const compY = 48;
    ctx.save();
    ctx.translate(compX, compY);

    // Compass Outer Ring
    ctx.fillStyle = '#FAF7F2';
    ctx.strokeStyle = '#172B36';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#C49A60';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.stroke();

    // Rotate needle to point true North relative to plot orientation
    ctx.rotate((plan.compassRotationDeg * Math.PI) / 180);

    // North Spear (Royal Gold + Midnight)
    ctx.fillStyle = '#C49A60';
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#172B36';
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(23, 43, 54, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.lineTo(4, 0);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#172B36';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -29);
    ctx.restore();

    // Sheet Title Stamp (Top-Left)
    ctx.save();
    ctx.fillStyle = '#172B36';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${input.projectName.toUpperCase()} — ${currentFloor.floorLabel.toUpperCase()}`,
      18,
      22
    );
    ctx.fillStyle = '#667C70';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(
      `Footprint: ${currentFloor.footprintWidth}' × ${currentFloor.footprintHeight}' (${currentFloor.builtUpAreaSqFt} sq ft) · Variation #${plan.seed + 1}`,
      18,
      37
    );
    ctx.restore();
  }, [plan, currentFloor, zoom, pan, input.projectName, input.plot.facing, input.plot.roadWidthFt]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const safeName = (input.projectName || 'vastuva-plan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.download = `${safeName}-${currentFloor.floorLabel.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(23, 43, 54);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(244, 239, 230);
    doc.setFontSize(16);
    doc.text('VASTUVA AI — Architectural Floor Plan & Estimate Report', 14, 13);
    doc.setFontSize(9);
    doc.setTextColor(196, 154, 96);
    doc.text('Smart Spaces. Inspired Living.', pageW - 58, 13);

    // Project Summary
    doc.setTextColor(23, 43, 54);
    doc.setFontSize(12);
    doc.text(`${input.projectName} (${currentFloor.floorLabel})`, 14, 32);
    doc.setFontSize(9.5);
    doc.text(
      `Plot: ${plan.plotWidthFt} × ${plan.plotLengthFt} ft (${plan.plotAreaSqFt} sq ft) | Facing: ${plan.facing} | Style: ${input.design.style} | Total Built-Up: ${plan.totalBuiltUpAreaSqFt} sq ft`,
      14,
      38
    );

    // Canvas Image
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 14, 43, 172, 112);

    // Room Schedule & Budget Column
    let yCursor = 46;
    const colX = 194;
    doc.setFontSize(10.5);
    doc.setTextColor(23, 43, 54);
    doc.text('Room Schedule', colX, yCursor);
    yCursor += 6;
    doc.setFontSize(8.5);
    currentFloor.rooms.slice(0, 12).forEach((room) => {
      doc.text(
        `${room.name}: ${room.width.toFixed(1)}' × ${room.height.toFixed(1)}' (${room.areaSqFt} sq ft)`,
        colX,
        yCursor
      );
      yCursor += 5;
    });

    yCursor += 4;
    doc.setFontSize(10.5);
    doc.text('Construction Estimate', colX, yCursor);
    yCursor += 6;
    doc.setFontSize(9);
    doc.text(`Total Estimated: ${formatINR(budget.totalEstimatedCost)}`, colX, yCursor);
    yCursor += 5;
    doc.setFontSize(8);
    doc.text(`Rate: ${formatINR(budget.effectiveRatePerSqFt)} / sq ft`, colX, yCursor);
    yCursor += 6;
    budget.breakdown.slice(0, 8).forEach((b) => {
      doc.text(`${b.label}: ${formatINR(b.amount)} (${b.percentage}%)`, colX, yCursor);
      yCursor += 4.5;
    });

    doc.setFontSize(7.5);
    doc.setTextColor(102, 124, 112);
    doc.text(
      'Disclaimer: Conceptual layout & approximate cost estimate for planning purposes only. Consult a licensed architect/structural engineer before construction.',
      14,
      198
    );

    const safeName = (input.projectName || 'vastuva-report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    doc.save(`${safeName}-architectural-report.pdf`);
  };

  return (
    <div className="space-y-5">
      {/* Capacity / Fit Warnings */}
      {plan.warnings.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-700/35 bg-amber-50 p-5 text-amber-950"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold">Space Planning Warning</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                {plan.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              {plan.recommendations.length > 0 && (
                <div className="mt-3 border-t border-amber-700/15 pt-2.5 text-xs">
                  <span className="font-semibold">Recommended Adjustments: </span>
                  {plan.recommendations.join(' ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Floor Tabs & Zoom / Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#172B36]/12 bg-white p-3.5">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Floor levels">
          {plan.floors.map((floor) => (
            <button
              key={floor.floorIndex}
              type="button"
              role="tab"
              aria-selected={safeFloorIdx === floor.floorIndex}
              onClick={() => onSelectFloor(floor.floorIndex)}
              className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                safeFloorIdx === floor.floorIndex
                  ? 'bg-[#172B36] text-white'
                  : 'bg-[#FAF7F2] text-[#172B36]/80 hover:bg-[#F4EFE6]'
              }`}
            >
              {floor.floorLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))}
            aria-label="Zoom in floor plan"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#172B36]/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#172B36] hover:border-[#C49A60]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Zoom In
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            aria-label="Zoom out floor plan"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#172B36]/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#172B36] hover:border-[#C49A60]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
            Zoom Out
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#172B36]/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#172B36] hover:border-[#C49A60]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset View
          </button>
          <button
            type="button"
            onClick={onRegenerateLayout}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#C49A60] bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#172B36] hover:bg-[#C49A60]/15"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#9F7840]" />
            Generate Another Layout
          </button>
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#172B36] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F1E26]"
          >
            <Download className="h-3.5 w-3.5 text-[#C49A60]" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#C49A60] px-3.5 py-1.5 text-xs font-bold text-[#172B36] hover:bg-[#b58b51]"
          >
            <FileText className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Main 2D Canvas Blueprint + Room Schedule Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#172B36]/15 bg-[#FBF9F5]">
            <canvas
              ref={canvasRef}
              data-testid="floorplan-2d-canvas"
              onMouseDown={(e) => {
                setIsDragging(true);
                dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPan({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              className={`block h-[460px] w-full sm:h-[540px] ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              aria-label={`2D Architectural Floor Plan for ${currentFloor.floorLabel}`}
            />
          </div>
          <p className="mt-2 text-xs text-[#667C70]">
            Drag canvas to pan · Use Zoom controls to inspect wall dimensions, door swing arcs, and window placement.
          </p>
        </div>

        {/* Room Schedule & Area Breakdown Sidebar */}
        <aside className="flex flex-col justify-between rounded-xl border border-[#172B36]/12 bg-white p-5 lg:col-span-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#172B36]/10 pb-3">
              <h3 className="text-base font-bold text-[#172B36]">
                {currentFloor.floorLabel} Schedule
              </h3>
              <span className="font-mono text-xs text-[#667C70] tabular-nums">
                {currentFloor.rooms.length} zones
              </span>
            </div>

            <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {currentFloor.rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border border-[#172B36]/10 bg-[#FAF7F2] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-sm border border-[#172B36]/25"
                      style={{ backgroundColor: room.color }}
                    />
                    <span className="font-semibold text-[#172B36]">{room.name}</span>
                  </div>
                  <span className="font-mono text-[#50646E] tabular-nums">
                    {room.width.toFixed(1)}′ × {room.height.toFixed(1)}′ · {room.areaSqFt} sf
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-[#172B36]/10 pt-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[#667C70]">Total Built-Up Area</span>
              <span className="font-mono font-semibold text-[#172B36] tabular-nums">
                {plan.totalBuiltUpAreaSqFt.toLocaleString()} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667C70]">Net Carpet Area</span>
              <span className="font-mono font-semibold text-[#172B36] tabular-nums">
                {plan.carpetAreaSqFt.toLocaleString()} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667C70]">Wall &amp; Circulation Reserve</span>
              <span className="font-mono font-semibold text-[#172B36] tabular-nums">
                {plan.wallAndCirculationReserveSqFt.toLocaleString()} sq ft
              </span>
            </div>
            {plan.vastuNotes.length > 0 && (
              <div className="mt-3 rounded-lg bg-[#E6ECE8]/60 p-3 text-[#172B36]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Compass className="h-3.5 w-3.5 text-[#667C70]" />
                  Orientation &amp; Vastu Notes
                </div>
                <p className="mt-1 leading-relaxed text-[#172B36]/80">
                  {plan.vastuNotes[0]}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
