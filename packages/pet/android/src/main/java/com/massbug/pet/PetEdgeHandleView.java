package com.massbug.pet;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;

final class PetEdgeHandleView extends View {

    private final Paint backgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint arrowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path backgroundPath = new Path();
    private final Path arrowPath = new Path();
    private int side = -1;

    PetEdgeHandleView(Context context) {
        super(context);
        backgroundPaint.setColor(Color.argb(220, 39, 39, 42));
        arrowPaint.setColor(Color.WHITE);
        arrowPaint.setStyle(Paint.Style.STROKE);
        arrowPaint.setStrokeCap(Paint.Cap.ROUND);
        arrowPaint.setStrokeJoin(Paint.Join.ROUND);
        arrowPaint.setStrokeWidth(dpToPx(2));
    }

    void setSide(int side) {
        this.side = side < 0 ? -1 : 1;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float width = getWidth();
        float height = getHeight();
        float radius = dpToPx(12);
        float[] radii = side < 0
            ? new float[] { 0, 0, radius, radius, radius, radius, 0, 0 }
            : new float[] { radius, radius, 0, 0, 0, 0, radius, radius };

        backgroundPath.reset();
        backgroundPath.addRoundRect(new RectF(0, 0, width, height), radii, Path.Direction.CW);
        canvas.drawPath(backgroundPath, backgroundPaint);

        float centerX = width / 2;
        float centerY = height / 2;
        float arrowHalfWidth = dpToPx(3.5f);
        float arrowHalfHeight = dpToPx(6);
        float direction = side < 0 ? 1 : -1;

        arrowPath.reset();
        arrowPath.moveTo(centerX - direction * arrowHalfWidth, centerY - arrowHalfHeight);
        arrowPath.lineTo(centerX + direction * arrowHalfWidth, centerY);
        arrowPath.lineTo(centerX - direction * arrowHalfWidth, centerY + arrowHalfHeight);
        canvas.drawPath(arrowPath, arrowPaint);
    }

    private float dpToPx(float dp) {
        return dp * getResources().getDisplayMetrics().density;
    }
}
