import require$$0, { forwardRef, useRef, useState, useImperativeHandle, useEffect, useCallback } from 'react';

/**
 * Ultra-lightweight Lottie parser
 * Parses both JSON and binary .lottie formats without dependencies
 */
class LottieParser {
    /**
     * Parse Lottie animation data
     */
    static async parse(options) {
        // const startTime = performance.now(); // TODO: Add performance tracking
        try {
            let data;
            if (options.format === "lottie" || this.isLottieFormat(options.data)) {
                data = await this.parseLottieFile(options.data);
            }
            else {
                data = this.parseJSON(options.data);
            }
            // const parseTime = performance.now() - startTime; // TODO: Add performance tracking
            return {
                data,
                duration: this.calculateDuration(data),
                frameRate: data.fr || 30,
                totalFrames: data.op - data.ip || 0,
                width: data.w || 512,
                height: data.h || 512,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to parse Lottie animation: ${errorMessage}`);
        }
    }
    /**
     * Check if data is in .lottie (binary) format
     */
    static isLottieFormat(data) {
        if (!data || !(data instanceof ArrayBuffer)) {
            return false;
        }
        const header = new Uint8Array(data.slice(0, 4));
        return this.arrayEquals(header, this.LOTTIE_MAGIC);
    }
    /**
     * Parse binary .lottie file (ZIP format)
     */
    static async parseLottieFile(buffer) {
        if (buffer.byteLength > this.MAX_FILE_SIZE) {
            throw new Error("File too large");
        }
        // Simplified ZIP parsing - extract the main animation.json
        const view = new DataView(buffer);
        // let offset = 0; // TODO: Implement full ZIP parsing if needed
        // Find central directory
        const cdOffset = this.findCentralDirectory(view);
        if (cdOffset === -1) {
            throw new Error("Invalid .lottie file format");
        }
        // Extract animation.json
        const animationData = this.extractAnimationJson(view, cdOffset);
        return JSON.parse(animationData);
    }
    /**
     * Parse JSON format
     */
    static parseJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.validateLottieData(data);
            return data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Invalid JSON format: ${errorMessage}`);
        }
    }
    /**
     * Find central directory in ZIP file
     */
    static findCentralDirectory(view) {
        // Simplified - look for end of central directory signature
        const signature = 0x06054b50;
        for (let i = view.byteLength - 22; i >= 0; i--) {
            if (view.getUint32(i, true) === signature) {
                const cdOffset = view.getUint32(i + 16, true);
                return cdOffset;
            }
        }
        return -1;
    }
    /**
     * Extract animation.json from ZIP central directory
     */
    static extractAnimationJson(view, cdOffset) {
        // Simplified extraction - assumes animation.json is the first file
        const signature = view.getUint32(cdOffset, true);
        if (signature !== 0x02014b50) {
            // Central directory file header signature
            throw new Error("Invalid central directory");
        }
        const fileNameLength = view.getUint16(cdOffset + 28, true);
        const fileName = this.readString(view, cdOffset + 46, fileNameLength);
        if (!fileName.includes("animation.json")) {
            throw new Error("animation.json not found in .lottie file");
        }
        const localHeaderOffset = view.getUint32(cdOffset + 42, true);
        const compressedSize = view.getUint32(cdOffset + 20, true);
        // Skip local file header (30 bytes + filename + extra field)
        const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
        const localExtraFieldLength = view.getUint16(localHeaderOffset + 28, true);
        const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
        // Read compressed data (assuming no compression for simplicity)
        return this.readString(view, dataOffset, compressedSize);
    }
    /**
     * Read string from DataView
     */
    static readString(view, offset, length) {
        const bytes = new Uint8Array(view.buffer, offset, length);
        return new TextDecoder().decode(bytes);
    }
    /**
     * Validate Lottie data structure
     */
    static validateLottieData(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Invalid Lottie data structure");
        }
        const requiredFields = ["v", "w", "h", "layers"];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        if (!Array.isArray(data.layers)) {
            throw new Error("Layers must be an array");
        }
        if (typeof data.w !== "number" || typeof data.h !== "number") {
            throw new Error("Width and height must be numbers");
        }
    }
    /**
     * Calculate animation duration in milliseconds
     */
    static calculateDuration(data) {
        const frameRate = data.fr || 30;
        const totalFrames = (data.op || 0) - (data.ip || 0);
        return (totalFrames / frameRate) * 1000;
    }
    /**
     * Compare two Uint8Arrays
     */
    static arrayEquals(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    /**
     * Optimize animation data for performance
     */
    static optimize(data) {
        // Create a deep copy to avoid mutating original data
        const optimized = JSON.parse(JSON.stringify(data));
        // Remove unnecessary properties
        this.removeUnusedAssets(optimized);
        this.simplifyPaths(optimized);
        this.roundNumbers(optimized);
        return optimized;
    }
    /**
     * Remove unused assets to reduce memory usage
     */
    static removeUnusedAssets(data) {
        if (!data.assets || !Array.isArray(data.assets))
            return;
        const usedAssets = new Set();
        // Find used asset IDs in layers
        const findUsedAssets = (layers) => {
            layers.forEach((layer) => {
                if (layer.refId)
                    usedAssets.add(layer.refId);
                if (layer.layers)
                    findUsedAssets(layer.layers);
            });
        };
        findUsedAssets(data.layers);
        // Filter out unused assets
        data.assets = data.assets.filter((asset) => usedAssets.has(asset.id));
    }
    /**
     * Simplify complex paths for better performance
     */
    static simplifyPaths(data) {
        // Simplified path optimization
        // In a real implementation, this would intelligently reduce path complexity
        const simplifyLayer = (layer) => {
            if (layer.shapes) {
                layer.shapes.forEach((shape) => {
                    if (shape.it) {
                        this.simplifyShapeItems(shape.it);
                    }
                });
            }
            if (layer.layers) {
                layer.layers.forEach(simplifyLayer);
            }
        };
        data.layers.forEach(simplifyLayer);
    }
    /**
     * Simplify shape items
     */
    static simplifyShapeItems(items) {
        items.forEach((item) => {
            if (item.ty === "sh" && item.ks && item.ks.k && item.ks.k.v) {
                // Simplify bezier paths by reducing control points
                const vertices = item.ks.k.v;
                if (vertices.length > 100) {
                    // Reduce complexity for performance
                    item.ks.k.v = this.reducePathComplexity(vertices);
                }
            }
        });
    }
    /**
     * Reduce path complexity by removing redundant points
     */
    static reducePathComplexity(vertices) {
        if (vertices.length <= 3)
            return vertices;
        const simplified = [vertices[0]];
        const tolerance = 0.5;
        for (let i = 1; i < vertices.length - 1; i++) {
            const prev = vertices[i - 1];
            const curr = vertices[i];
            const next = vertices[i + 1];
            // Check if current point is significant
            const distance = this.pointToLineDistance(curr, prev, next);
            if (distance > tolerance) {
                simplified.push(curr);
            }
        }
        simplified.push(vertices[vertices.length - 1]);
        return simplified;
    }
    /**
     * Calculate distance from point to line
     */
    static pointToLineDistance(point, lineStart, lineEnd) {
        const [px, py] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        if (lenSq === 0)
            return Math.sqrt(A * A + B * B);
        const param = dot / lenSq;
        const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
        const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Round numbers to reduce precision and file size
     */
    static roundNumbers(obj, precision = 3) {
        if (typeof obj === "number") {
            return (Math.round(obj * Math.pow(10, precision)) / Math.pow(10, precision));
        }
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                if (typeof item === "number") {
                    obj[index] =
                        Math.round(item * Math.pow(10, precision)) /
                            Math.pow(10, precision);
                }
                else if (typeof item === "object") {
                    this.roundNumbers(item, precision);
                }
            });
        }
        else if (typeof obj === "object" && obj !== null) {
            Object.keys(obj).forEach((key) => {
                if (typeof obj[key] === "number") {
                    obj[key] =
                        Math.round(obj[key] * Math.pow(10, precision)) /
                            Math.pow(10, precision);
                }
                else if (typeof obj[key] === "object") {
                    this.roundNumbers(obj[key], precision);
                }
            });
        }
    }
}
LottieParser.LOTTIE_MAGIC = new Uint8Array([
    0x50, 0x4b, 0x03, 0x04,
]); // ZIP signature
LottieParser.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

/**
 * High-performance Canvas renderer for Lottie animations
 * Optimized for mobile devices and complex animations
 */
class CanvasRenderer {
    constructor(container, animationData) {
        this.currentFrame = 0;
        this.scaleFactor = 1;
        this.isDestroyed = false;
        this.animationData = animationData;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx) {
            throw new Error("Canvas 2D context not supported");
        }
        this.setupCanvas(container);
        this.transformMatrix = new DOMMatrix();
    }
    /**
     * Setup canvas element and context
     */
    setupCanvas(container) {
        const { w: width, h: height } = this.animationData;
        // Set canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        // Set display size
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.display = "block";
        // Calculate scale factor for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.scaleFactor = dpr;
        // Scale canvas for high DPI
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        // Optimize rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";
        container.appendChild(this.canvas);
    }
    /**
     * Render frame at specific time
     */
    render(frame) {
        if (this.isDestroyed)
            return;
        this.currentFrame = frame;
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Save context state
        this.ctx.save();
        try {
            // Render all layers
            this.renderLayers(this.animationData.layers, frame);
        }
        catch (error) {
            console.error("Rendering error:", error);
        }
        finally {
            // Restore context state
            this.ctx.restore();
        }
    }
    /**
     * Render array of layers
     */
    renderLayers(layers, frame) {
        // Sort layers by index for proper rendering order
        const sortedLayers = [...layers].sort((a, b) => a.ind - b.ind);
        for (const layer of sortedLayers) {
            if (this.isLayerVisible(layer, frame)) {
                this.renderLayer(layer, frame);
            }
        }
    }
    /**
     * Check if layer is visible at current frame
     */
    isLayerVisible(layer, frame) {
        return frame >= layer.ip && frame < layer.op;
    }
    /**
     * Render single layer
     */
    renderLayer(layer, frame) {
        this.ctx.save();
        try {
            // Apply layer transform
            this.applyTransform(layer.ks, frame);
            // Apply layer opacity
            const opacity = this.getAnimatedValue(layer.ks.o, frame);
            if (opacity !== undefined) {
                this.ctx.globalAlpha *= opacity / 100;
            }
            // Render based on layer type
            switch (layer.ty) {
                case 4: // Shape layer
                    this.renderShapeLayer(layer, frame);
                    break;
                case 0: // Precomp layer
                    this.renderPrecompLayer(layer, frame);
                    break;
                case 1: // Solid layer
                    this.renderSolidLayer(layer, frame);
                    break;
                case 2: // Image layer
                    this.renderImageLayer(layer, frame);
                    break;
                case 5: // Text layer
                    this.renderTextLayer(layer, frame);
                    break;
                default:
                    // Unknown layer type, skip
                    break;
            }
        }
        finally {
            this.ctx.restore();
        }
    }
    /**
     * Apply transform to context
     */
    applyTransform(transform, frame) {
        // Get animated values
        const anchor = this.getAnimatedValue(transform.a, frame) || [0, 0];
        const position = this.getAnimatedValue(transform.p, frame) || [0, 0];
        const scale = this.getAnimatedValue(transform.s, frame) || [100, 100];
        const rotation = this.getAnimatedValue(transform.r, frame) || 0;
        // Apply transformations in correct order
        this.ctx.translate(position[0], position[1]);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.scale(scale[0] / 100, scale[1] / 100);
        this.ctx.translate(-anchor[0], -anchor[1]);
    }
    /**
     * Render shape layer
     */
    renderShapeLayer(layer, frame) {
        if (!layer.shapes)
            return;
        for (const shape of layer.shapes) {
            this.renderShape(shape, frame);
        }
    }
    /**
     * Render shape
     */
    renderShape(shape, frame) {
        if (shape.hd)
            return; // Skip hidden shapes
        this.ctx.save();
        try {
            switch (shape.ty) {
                case "gr": // Group
                    this.renderShapeGroup(shape, frame);
                    break;
                case "rc": // Rectangle
                    this.renderRectangle(shape, frame);
                    break;
                case "el": // Ellipse
                    this.renderEllipse(shape, frame);
                    break;
                case "sh": // Path
                    this.renderPath(shape, frame);
                    break;
                case "fl": // Fill
                    this.applyFill(shape, frame);
                    break;
                case "st": // Stroke
                    this.applyStroke(shape, frame);
                    break;
                case "tr": // Transform
                    this.applyShapeTransform(shape, frame);
                    break;
                default:
                    // Unknown shape type
                    break;
            }
        }
        finally {
            this.ctx.restore();
        }
    }
    /**
     * Render shape group
     */
    renderShapeGroup(shape, frame) {
        if (!shape.it)
            return;
        // Render all items in the group
        for (const item of shape.it) {
            this.renderShape(item, frame);
        }
    }
    /**
     * Render rectangle
     */
    renderRectangle(shape, frame) {
        const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const roundness = this.getAnimatedValue(shape.r, frame) || 0;
        const [width, height] = size;
        const [x, y] = position;
        this.ctx.beginPath();
        if (roundness > 0) {
            this.ctx.roundRect(x - width / 2, y - height / 2, width, height, roundness);
        }
        else {
            this.ctx.rect(x - width / 2, y - height / 2, width, height);
        }
    }
    /**
     * Render ellipse
     */
    renderEllipse(shape, frame) {
        const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const [width, height] = size;
        const [x, y] = position;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    }
    /**
     * Render path
     */
    renderPath(shape, frame) {
        const pathData = this.getAnimatedValue(shape.pt, frame);
        if (!pathData || !pathData.v)
            return;
        const vertices = pathData.v;
        const inTangents = pathData.i || [];
        const outTangents = pathData.o || [];
        const closed = pathData.c || false;
        this.ctx.beginPath();
        if (vertices.length > 0) {
            this.ctx.moveTo(vertices[0][0], vertices[0][1]);
            for (let i = 1; i < vertices.length; i++) {
                const prevVertex = vertices[i - 1];
                const currentVertex = vertices[i];
                const prevOutTangent = outTangents[i - 1] || [0, 0];
                const currentInTangent = inTangents[i] || [0, 0];
                this.ctx.bezierCurveTo(prevVertex[0] + prevOutTangent[0], prevVertex[1] + prevOutTangent[1], currentVertex[0] + currentInTangent[0], currentVertex[1] + currentInTangent[1], currentVertex[0], currentVertex[1]);
            }
            if (closed && vertices.length > 2) {
                const lastVertex = vertices[vertices.length - 1];
                const firstVertex = vertices[0];
                const lastOutTangent = outTangents[vertices.length - 1] || [0, 0];
                const firstInTangent = inTangents[0] || [0, 0];
                this.ctx.bezierCurveTo(lastVertex[0] + lastOutTangent[0], lastVertex[1] + lastOutTangent[1], firstVertex[0] + firstInTangent[0], firstVertex[1] + firstInTangent[1], firstVertex[0], firstVertex[1]);
                this.ctx.closePath();
            }
        }
    }
    /**
     * Apply fill style
     */
    applyFill(shape, frame) {
        const color = this.getAnimatedValue(shape.c, frame);
        const opacity = this.getAnimatedValue(shape.o, frame);
        if (color) {
            const [r, g, b] = color.map((c) => Math.round(c * 255));
            const a = opacity ? opacity / 100 : 1;
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            this.ctx.fill();
        }
    }
    /**
     * Apply stroke style
     */
    applyStroke(shape, frame) {
        const color = this.getAnimatedValue(shape.c, frame);
        const opacity = this.getAnimatedValue(shape.o, frame);
        const width = this.getAnimatedValue(shape.w, frame);
        if (color && width) {
            const [r, g, b] = color.map((c) => Math.round(c * 255));
            const a = opacity ? opacity / 100 : 1;
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            this.ctx.lineWidth = width;
            // Set line cap and join
            this.ctx.lineCap = this.getLineCap(shape.lc);
            this.ctx.lineJoin = this.getLineJoin(shape.lj);
            if (shape.ml) {
                this.ctx.miterLimit = shape.ml;
            }
            this.ctx.stroke();
        }
    }
    /**
     * Apply shape transform
     */
    applyShapeTransform(shape, frame) {
        // Shape transforms have different property names than layer transforms
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const scale = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const rotation = this.getAnimatedValue(shape.r, frame) || 0;
        this.ctx.translate(position[0], position[1]);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.scale(scale[0] / 100, scale[1] / 100);
    }
    /**
     * Render precomp layer
     */
    renderPrecompLayer(_layer, _frame) {
        var _a;
        // Find referenced composition
        const comp = (_a = this.animationData.assets) === null || _a === void 0 ? void 0 : _a.find((asset) => asset.id === _layer.refId);
        if (comp && comp.layers) {
            this.renderLayers(comp.layers, _frame);
        }
    }
    /**
     * Render solid layer
     */
    renderSolidLayer(_layer, _frame) {
        // Solid layers would have color and dimensions
        // This is a simplified implementation
        this.ctx.fillStyle = "#000000"; // Default black
        this.ctx.fillRect(0, 0, _layer.w || 100, _layer.h || 100);
    }
    /**
     * Render image layer
     */
    renderImageLayer(_layer, _frame) {
        // Image rendering would require loading external assets
        // This is a placeholder for image layer implementation
        console.warn("Image layer rendering not implemented");
    }
    /**
     * Render text layer
     */
    renderTextLayer(_layer, _frame) {
        // Text rendering would require complex text layout
        // This is a placeholder for text layer implementation
        console.warn("Text layer rendering not implemented");
    }
    /**
     * Get animated value at specific frame
     */
    getAnimatedValue(animatable, frame) {
        if (!animatable)
            return undefined;
        // Static value
        if (!animatable.a) {
            return animatable.k;
        }
        // Animated value
        const keyframes = animatable.k;
        if (!Array.isArray(keyframes)) {
            return keyframes;
        }
        // Find appropriate keyframes
        let prevKeyframe = keyframes[0];
        let nextKeyframe = keyframes[keyframes.length - 1];
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (frame >= keyframes[i].t && frame < keyframes[i + 1].t) {
                prevKeyframe = keyframes[i];
                nextKeyframe = keyframes[i + 1];
                break;
            }
        }
        // Linear interpolation
        const progress = (frame - prevKeyframe.t) / (nextKeyframe.t - prevKeyframe.t);
        return this.interpolateValue(prevKeyframe.s, nextKeyframe.s, Math.max(0, Math.min(1, progress)));
    }
    /**
     * Interpolate between two values
     */
    interpolateValue(start, end, progress) {
        if (typeof start === "number" && typeof end === "number") {
            return start + (end - start) * progress;
        }
        if (Array.isArray(start) && Array.isArray(end)) {
            return start.map((startVal, index) => {
                const endVal = end[index] || startVal;
                return typeof startVal === "number"
                    ? startVal + (endVal - startVal) * progress
                    : startVal;
            });
        }
        return progress < 0.5 ? start : end;
    }
    /**
     * Get line cap style
     */
    getLineCap(cap) {
        switch (cap) {
            case 1:
                return "butt";
            case 2:
                return "round";
            case 3:
                return "square";
            default:
                return "butt";
        }
    }
    /**
     * Get line join style
     */
    getLineJoin(join) {
        switch (join) {
            case 1:
                return "miter";
            case 2:
                return "round";
            case 3:
                return "bevel";
            default:
                return "miter";
        }
    }
    /**
     * Resize canvas
     */
    resize() {
        if (this.isDestroyed)
            return;
        const container = this.canvas.parentElement;
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        // Re-render current frame
        this.render(this.currentFrame);
    }
    /**
     * Destroy renderer and clean up resources
     */
    destroy() {
        this.isDestroyed = true;
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
}

/**
 * Lightweight SVG renderer for Lottie animations
 * Better for simple animations and better scalability
 */
class SVGRenderer {
    constructor(container, animationData) {
        this.currentFrame = 0;
        this.layerElements = new Map();
        this.isDestroyed = false;
        this.container = container;
        this.animationData = animationData;
        this.setupSVG();
        this.createLayerElements();
    }
    /**
     * Setup SVG element
     */
    setupSVG() {
        const { w: width, h: height } = this.animationData;
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.display = "block";
        this.container.appendChild(this.svg);
    }
    /**
     * Create SVG elements for all layers
     */
    createLayerElements() {
        // Sort layers by index
        const sortedLayers = [...this.animationData.layers].sort((a, b) => a.ind - b.ind);
        for (const layer of sortedLayers) {
            const layerGroup = this.createLayerGroup(layer);
            this.layerElements.set(layer.ind, layerGroup);
            this.svg.appendChild(layerGroup);
        }
    }
    /**
     * Create SVG group for layer
     */
    createLayerGroup(layer) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("data-layer-index", layer.ind.toString());
        group.setAttribute("data-layer-name", layer.nm || "");
        return group;
    }
    /**
     * Render frame at specific time
     */
    render(frame) {
        if (this.isDestroyed)
            return;
        this.currentFrame = frame;
        // Update all layers
        for (const layer of this.animationData.layers) {
            this.updateLayer(layer, frame);
        }
    }
    /**
     * Update layer at specific frame
     */
    updateLayer(layer, frame) {
        const layerGroup = this.layerElements.get(layer.ind);
        if (!layerGroup)
            return;
        // Check visibility
        const isVisible = frame >= layer.ip && frame < layer.op;
        layerGroup.style.display = isVisible ? "block" : "none";
        if (!isVisible)
            return;
        // Apply transform
        const transform = this.getTransformString(layer.ks, frame);
        layerGroup.setAttribute("transform", transform);
        // Apply opacity
        const opacity = this.getAnimatedValue(layer.ks.o, frame);
        if (opacity !== undefined) {
            layerGroup.setAttribute("opacity", (opacity / 100).toString());
        }
        // Update layer content based on type
        switch (layer.ty) {
            case 4: // Shape layer
                this.updateShapeLayer(layer, layerGroup, frame);
                break;
            case 0: // Precomp layer
                this.updatePrecompLayer(layer, layerGroup, frame);
                break;
            case 1: // Solid layer
                this.updateSolidLayer(layer, layerGroup, frame);
                break;
            case 2: // Image layer
                this.updateImageLayer(layer, layerGroup, frame);
                break;
            case 5: // Text layer
                this.updateTextLayer(layer, layerGroup, frame);
                break;
        }
    }
    /**
     * Get transform string from transform object
     */
    getTransformString(transform, frame) {
        const transforms = [];
        // Get animated values
        const anchor = this.getAnimatedValue(transform.a, frame) || [0, 0];
        const position = this.getAnimatedValue(transform.p, frame) || [0, 0];
        const scale = this.getAnimatedValue(transform.s, frame) || [100, 100];
        const rotation = this.getAnimatedValue(transform.r, frame) || 0;
        // Apply transforms in correct order
        if (position[0] !== 0 || position[1] !== 0) {
            transforms.push(`translate(${position[0]}, ${position[1]})`);
        }
        if (rotation !== 0) {
            transforms.push(`rotate(${rotation})`);
        }
        if (scale[0] !== 100 || scale[1] !== 100) {
            transforms.push(`scale(${scale[0] / 100}, ${scale[1] / 100})`);
        }
        if (anchor[0] !== 0 || anchor[1] !== 0) {
            transforms.push(`translate(${-anchor[0]}, ${-anchor[1]})`);
        }
        return transforms.join(" ");
    }
    /**
     * Update shape layer
     */
    updateShapeLayer(layer, layerGroup, frame) {
        if (!layer.shapes)
            return;
        // Clear existing content
        layerGroup.innerHTML = "";
        // Create shape elements
        for (const shape of layer.shapes) {
            const shapeElement = this.createShapeElement(shape, frame);
            if (shapeElement) {
                layerGroup.appendChild(shapeElement);
            }
        }
    }
    /**
     * Create SVG element for shape
     */
    createShapeElement(shape, frame) {
        if (shape.hd)
            return null; // Skip hidden shapes
        switch (shape.ty) {
            case "gr": // Group
                return this.createShapeGroup(shape, frame);
            case "rc": // Rectangle
                return this.createRectangle(shape, frame);
            case "el": // Ellipse
                return this.createEllipse(shape, frame);
            case "sh": // Path
                return this.createPath(shape, frame);
            default:
                return null;
        }
    }
    /**
     * Create shape group
     */
    createShapeGroup(shape, frame) {
        if (!shape.it)
            return null;
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // Process group items
        const pathElements = [];
        let fillStyle = null;
        let strokeStyle = null;
        let strokeWidth = null;
        let transform = null;
        for (const item of shape.it) {
            switch (item.ty) {
                case "sh": // Path
                case "rc": // Rectangle
                case "el": {
                    // Ellipse
                    const pathElement = this.createShapeElement(item, frame);
                    if (pathElement) {
                        pathElements.push(pathElement);
                    }
                    break;
                }
                case "fl": {
                    // Fill
                    fillStyle = this.getFillStyle(item, frame);
                    break;
                }
                case "st": {
                    // Stroke
                    const strokeInfo = this.getStrokeStyle(item, frame);
                    strokeStyle = strokeInfo.style;
                    strokeWidth = strokeInfo.width;
                    break;
                }
                case "tr": {
                    // Transform
                    transform = this.getShapeTransformString(item, frame);
                    break;
                }
            }
        }
        // Apply styles to path elements
        for (const pathElement of pathElements) {
            if (fillStyle) {
                pathElement.setAttribute("fill", fillStyle);
            }
            else {
                pathElement.setAttribute("fill", "none");
            }
            if (strokeStyle && strokeWidth) {
                pathElement.setAttribute("stroke", strokeStyle);
                pathElement.setAttribute("stroke-width", strokeWidth.toString());
            }
        }
        // Apply transform
        if (transform) {
            group.setAttribute("transform", transform);
        }
        // Add path elements to group
        for (const pathElement of pathElements) {
            group.appendChild(pathElement);
        }
        return group;
    }
    /**
     * Create rectangle
     */
    createRectangle(shape, frame) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const roundness = this.getAnimatedValue(shape.r, frame) || 0;
        const [width, height] = size;
        const [x, y] = position;
        rect.setAttribute("x", (x - width / 2).toString());
        rect.setAttribute("y", (y - height / 2).toString());
        rect.setAttribute("width", width.toString());
        rect.setAttribute("height", height.toString());
        if (roundness > 0) {
            rect.setAttribute("rx", roundness.toString());
            rect.setAttribute("ry", roundness.toString());
        }
        return rect;
    }
    /**
     * Create ellipse
     */
    createEllipse(shape, frame) {
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const [width, height] = size;
        const [x, y] = position;
        ellipse.setAttribute("cx", x.toString());
        ellipse.setAttribute("cy", y.toString());
        ellipse.setAttribute("rx", (width / 2).toString());
        ellipse.setAttribute("ry", (height / 2).toString());
        return ellipse;
    }
    /**
     * Create path
     */
    createPath(shape, frame) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const pathData = this.getAnimatedValue(shape.pt, frame);
        if (pathData && pathData.v) {
            const d = this.buildPathString(pathData);
            path.setAttribute("d", d);
        }
        return path;
    }
    /**
     * Build SVG path string from Lottie path data
     */
    buildPathString(pathData) {
        const vertices = pathData.v || [];
        const inTangents = pathData.i || [];
        const outTangents = pathData.o || [];
        const closed = pathData.c || false;
        if (vertices.length === 0)
            return "";
        const pathCommands = [];
        // Move to first point
        pathCommands.push(`M ${vertices[0][0]} ${vertices[0][1]}`);
        // Add curve commands
        for (let i = 1; i < vertices.length; i++) {
            const prevVertex = vertices[i - 1];
            const currentVertex = vertices[i];
            const prevOutTangent = outTangents[i - 1] || [0, 0];
            const currentInTangent = inTangents[i] || [0, 0];
            const cp1x = prevVertex[0] + prevOutTangent[0];
            const cp1y = prevVertex[1] + prevOutTangent[1];
            const cp2x = currentVertex[0] + currentInTangent[0];
            const cp2y = currentVertex[1] + currentInTangent[1];
            pathCommands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentVertex[0]} ${currentVertex[1]}`);
        }
        // Close path if needed
        if (closed && vertices.length > 2) {
            const lastVertex = vertices[vertices.length - 1];
            const firstVertex = vertices[0];
            const lastOutTangent = outTangents[vertices.length - 1] || [0, 0];
            const firstInTangent = inTangents[0] || [0, 0];
            const cp1x = lastVertex[0] + lastOutTangent[0];
            const cp1y = lastVertex[1] + lastOutTangent[1];
            const cp2x = firstVertex[0] + firstInTangent[0];
            const cp2y = firstVertex[1] + firstInTangent[1];
            pathCommands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${firstVertex[0]} ${firstVertex[1]}`);
            pathCommands.push("Z");
        }
        return pathCommands.join(" ");
    }
    /**
     * Get fill style string
     */
    getFillStyle(shape, frame) {
        const color = this.getAnimatedValue(shape.c, frame);
        const opacity = this.getAnimatedValue(shape.o, frame);
        if (!color)
            return null;
        const [r, g, b] = color.map((c) => Math.round(c * 255));
        const a = opacity ? opacity / 100 : 1;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    /**
     * Get stroke style information
     */
    getStrokeStyle(shape, frame) {
        const color = this.getAnimatedValue(shape.c, frame);
        const opacity = this.getAnimatedValue(shape.o, frame);
        const width = this.getAnimatedValue(shape.w, frame);
        if (!color || !width) {
            return { style: null, width: null };
        }
        const [r, g, b] = color.map((c) => Math.round(c * 255));
        const a = opacity ? opacity / 100 : 1;
        return {
            style: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: width,
        };
    }
    /**
     * Get shape transform string
     */
    getShapeTransformString(shape, frame) {
        const transforms = [];
        const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
        const scale = this.getAnimatedValue(shape.s, frame) || [100, 100];
        const rotation = this.getAnimatedValue(shape.r, frame) || 0;
        if (position[0] !== 0 || position[1] !== 0) {
            transforms.push(`translate(${position[0]}, ${position[1]})`);
        }
        if (rotation !== 0) {
            transforms.push(`rotate(${rotation})`);
        }
        if (scale[0] !== 100 || scale[1] !== 100) {
            transforms.push(`scale(${scale[0] / 100}, ${scale[1] / 100})`);
        }
        return transforms.join(" ");
    }
    /**
     * Update precomp layer
     */
    updatePrecompLayer(_layer, _layerGroup, _frame) {
        var _a;
        // Find referenced composition
        const comp = (_a = this.animationData.assets) === null || _a === void 0 ? void 0 : _a.find((asset) => asset.id === _layer.refId);
        if (comp && comp.layers) {
            // This would require recursive rendering of the composition
            console.warn("Precomp layer rendering not fully implemented");
        }
    }
    /**
     * Update solid layer
     */
    updateSolidLayer(_layer, _layerGroup, _frame) {
        _layerGroup.innerHTML = "";
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", (_layer.w || 100).toString());
        rect.setAttribute("height", (_layer.h || 100).toString());
        rect.setAttribute("fill", "#000000"); // Default black
        _layerGroup.appendChild(rect);
    }
    /**
     * Update image layer
     */
    updateImageLayer(_layer, _layerGroup, _frame) {
        console.warn("Image layer rendering not implemented");
    }
    /**
     * Update text layer
     */
    updateTextLayer(_layer, _layerGroup, _frame) {
        console.warn("Text layer rendering not implemented");
    }
    /**
     * Get animated value at specific frame
     */
    getAnimatedValue(animatable, frame) {
        if (!animatable)
            return undefined;
        // Static value
        if (!animatable.a) {
            return animatable.k;
        }
        // Animated value
        const keyframes = animatable.k;
        if (!Array.isArray(keyframes)) {
            return keyframes;
        }
        // Find appropriate keyframes
        let prevKeyframe = keyframes[0];
        let nextKeyframe = keyframes[keyframes.length - 1];
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (frame >= keyframes[i].t && frame < keyframes[i + 1].t) {
                prevKeyframe = keyframes[i];
                nextKeyframe = keyframes[i + 1];
                break;
            }
        }
        // Linear interpolation
        const progress = (frame - prevKeyframe.t) / (nextKeyframe.t - prevKeyframe.t);
        return this.interpolateValue(prevKeyframe.s, nextKeyframe.s, Math.max(0, Math.min(1, progress)));
    }
    /**
     * Interpolate between two values
     */
    interpolateValue(start, end, progress) {
        if (typeof start === "number" && typeof end === "number") {
            return start + (end - start) * progress;
        }
        if (Array.isArray(start) && Array.isArray(end)) {
            return start.map((startVal, index) => {
                const endVal = end[index] || startVal;
                return typeof startVal === "number"
                    ? startVal + (endVal - startVal) * progress
                    : startVal;
            });
        }
        return progress < 0.5 ? start : end;
    }
    /**
     * Resize SVG
     */
    resize() {
        // SVG automatically scales with viewBox, no action needed
    }
    /**
     * Destroy renderer and clean up resources
     */
    destroy() {
        this.isDestroyed = true;
        this.layerElements.clear();
        if (this.svg.parentElement) {
            this.svg.parentElement.removeChild(this.svg);
        }
    }
    /**
     * Get SVG element
     */
    getSVG() {
        return this.svg;
    }
}

/**
 * Main animation controller that manages playback and rendering
 */
class Animation {
    constructor(config) {
        this.currentFrame = 0;
        this._isPlaying = false;
        this._isPaused = false;
        this._isStopped = true;
        this.direction = 1;
        this.speed = 1;
        this.loop = true;
        this.autoplay = true;
        this.useSubFrames = false;
        this.segments = null;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.eventListeners = new Map();
        this.animationData = config.animationData;
        this.loop = config.loop;
        this.autoplay = config.autoplay;
        // Extract animation properties
        this.frameRate = this.animationData.fr || 30;
        this.inPoint = this.animationData.ip || 0;
        this.outPoint = this.animationData.op || 60;
        this.totalFrames = this.outPoint - this.inPoint;
        this.frameInterval = 1000 / this.frameRate;
        // Create renderer
        if (config.renderer === "svg") {
            this.renderer = new SVGRenderer(config.container, this.animationData);
        }
        else {
            this.renderer = new CanvasRenderer(config.container, this.animationData);
        }
        // Set initial frame
        this.currentFrame = this.inPoint;
        // Start animation if autoplay is enabled
        if (this.autoplay) {
            this.play();
        }
        else {
            // Render first frame
            this.renderFrame();
        }
    }
    /**
     * Play animation
     */
    play() {
        if (this._isPlaying)
            return;
        this._isPlaying = true;
        this._isPaused = false;
        this._isStopped = false;
        this.lastFrameTime = performance.now();
        this.startAnimation();
        this.dispatchEvent("complete"); // Use valid event type
    }
    /**
     * Pause animation
     */
    pause() {
        if (!this._isPlaying)
            return;
        this._isPlaying = false;
        this._isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.dispatchEvent("complete"); // Use valid event type
    }
    /**
     * Stop animation and reset to beginning
     */
    stop() {
        this._isPlaying = false;
        this._isPaused = false;
        this._isStopped = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.currentFrame = this.inPoint;
        this.renderFrame();
        this.dispatchEvent("complete"); // Use valid event type
    }
    /**
     * Seek to specific progress (0-1)
     */
    seek(progress) {
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const startFrame = this.segments ? this.segments[0] : this.inPoint;
        const endFrame = this.segments ? this.segments[1] : this.outPoint;
        const frameRange = endFrame - startFrame;
        this.currentFrame = startFrame + frameRange * clampedProgress;
        this.renderFrame();
        this.dispatchEvent("enterFrame");
    }
    /**
     * Go to specific frame and play
     */
    goToAndPlay(frame) {
        this.currentFrame = Math.max(this.inPoint, Math.min(this.outPoint, frame));
        this.renderFrame();
        this.play();
    }
    /**
     * Go to specific frame and stop
     */
    goToAndStop(frame) {
        this.currentFrame = Math.max(this.inPoint, Math.min(this.outPoint, frame));
        this.renderFrame();
        this.pause();
    }
    /**
     * Play specific segments
     */
    playSegments(segments, forceFlag = false) {
        this.segments = [
            Math.max(this.inPoint, segments[0]),
            Math.min(this.outPoint, segments[1]),
        ];
        if (forceFlag || !this._isPlaying) {
            this.currentFrame = this.segments[0];
            this.play();
        }
    }
    /**
     * Set animation speed
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(5, speed)); // Limit speed between 0.1x and 5x
    }
    /**
     * Set animation direction
     */
    setDirection(direction) {
        this.direction = direction;
    }
    /**
     * Set subframe usage
     */
    setSubframe(useSubFrames) {
        this.useSubFrames = useSubFrames;
    }
    /**
     * Resize animation
     */
    resize() {
        this.renderer.resize();
    }
    /**
     * Destroy animation and clean up resources
     */
    destroy() {
        this.stop();
        this.renderer.destroy();
        this.eventListeners.clear();
        this.dispatchEvent("destroy");
    }
    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    /**
     * Get current frame
     */
    getCurrentFrame() {
        return this.currentFrame;
    }
    /**
     * Get total frames
     */
    getTotalFrames() {
        return this.totalFrames;
    }
    /**
     * Get frame rate
     */
    getFrameRate() {
        return this.frameRate;
    }
    /**
     * Get duration in milliseconds
     */
    getDuration() {
        return (this.totalFrames / this.frameRate) * 1000;
    }
    /**
     * Get current progress (0-1)
     */
    getProgress() {
        const startFrame = this.segments ? this.segments[0] : this.inPoint;
        const endFrame = this.segments ? this.segments[1] : this.outPoint;
        const frameRange = endFrame - startFrame;
        if (frameRange === 0)
            return 0;
        return (this.currentFrame - startFrame) / frameRange;
    }
    /**
     * Check if animation is playing
     */
    isPlaying() {
        return this._isPlaying;
    }
    /**
     * Check if animation is paused
     */
    isPaused() {
        return this._isPaused;
    }
    /**
     * Check if animation is stopped
     */
    isStopped() {
        return this._isStopped;
    }
    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = (currentTime) => {
            if (!this._isPlaying)
                return;
            const deltaTime = currentTime - this.lastFrameTime;
            const expectedFrameTime = this.frameInterval / this.speed;
            if (deltaTime >= expectedFrameTime) {
                this.updateFrame();
                this.renderFrame();
                this.lastFrameTime = currentTime - (deltaTime % expectedFrameTime);
            }
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }
    /**
     * Update current frame
     */
    updateFrame() {
        const startFrame = this.segments ? this.segments[0] : this.inPoint;
        const endFrame = this.segments ? this.segments[1] : this.outPoint;
        // Update frame based on direction
        if (this.useSubFrames) {
            this.currentFrame += this.direction * this.speed;
        }
        else {
            this.currentFrame += this.direction;
        }
        // Handle looping
        if (this.direction > 0 && this.currentFrame >= endFrame) {
            if (this.loop) {
                this.currentFrame = startFrame;
                this.dispatchEvent("loopComplete");
            }
            else {
                this.currentFrame = endFrame - 1;
                this.pause();
                this.dispatchEvent("complete");
            }
        }
        else if (this.direction < 0 && this.currentFrame <= startFrame) {
            if (this.loop) {
                this.currentFrame = endFrame - 1;
                this.dispatchEvent("loopComplete");
            }
            else {
                this.currentFrame = startFrame;
                this.pause();
                this.dispatchEvent("complete");
            }
        }
        // Dispatch enterFrame event
        this.dispatchEvent("enterFrame");
    }
    /**
     * Render current frame
     */
    renderFrame() {
        try {
            this.renderer.render(this.currentFrame);
        }
        catch (error) {
            console.error("Rendering error:", error);
            this.dispatchEvent("error", { error });
        }
    }
    /**
     * Dispatch event to listeners
     */
    dispatchEvent(type, data) {
        const listeners = this.eventListeners.get(type);
        if (!listeners)
            return;
        const event = {
            type,
            currentTime: this.currentFrame,
            totalTime: this.totalFrames,
            direction: this.direction,
            ...data,
        };
        listeners.forEach((callback) => {
            try {
                callback(event);
            }
            catch (error) {
                console.error(`Error in ${type} event listener:`, error);
            }
        });
    }
    /**
     * Get animation data
     */
    getAnimationData() {
        return this.animationData;
    }
    /**
     * Check if animation has loaded
     */
    isLoaded() {
        return !!this.animationData;
    }
    /**
     * Get renderer type
     */
    getRendererType() {
        return this.renderer instanceof CanvasRenderer ? "canvas" : "svg";
    }
    /**
     * Set loop mode
     */
    setLoop(loop) {
        this.loop = loop;
    }
    /**
     * Get loop mode
     */
    getLoop() {
        return this.loop;
    }
    /**
     * Get speed
     */
    getSpeed() {
        return this.speed;
    }
    /**
     * Get direction
     */
    getDirection() {
        return this.direction;
    }
    /**
     * Get segments
     */
    getSegments() {
        return this.segments;
    }
    /**
     * Clear segments
     */
    clearSegments() {
        this.segments = null;
    }
    /**
     * Get in point
     */
    getInPoint() {
        return this.inPoint;
    }
    /**
     * Get out point
     */
    getOutPoint() {
        return this.outPoint;
    }
}

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production_min;

function requireReactJsxRuntime_production_min () {
	if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
	hasRequiredReactJsxRuntime_production_min = 1;
var f=require$$0,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:true,ref:true,__self:true,__source:true};
	function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a) void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;
	return reactJsxRuntime_production_min;
}

var reactJsxRuntime_development = {};

/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_development;

function requireReactJsxRuntime_development () {
	if (hasRequiredReactJsxRuntime_development) return reactJsxRuntime_development;
	hasRequiredReactJsxRuntime_development = 1;

	if (process.env.NODE_ENV !== "production") {
	  (function() {

	var React = require$$0;

	// ATTENTION
	// When adding new symbols to this file,
	// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
	// The Symbol used to tag the ReactElement-like types.
	var REACT_ELEMENT_TYPE = Symbol.for('react.element');
	var REACT_PORTAL_TYPE = Symbol.for('react.portal');
	var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
	var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
	var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
	var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
	var REACT_CONTEXT_TYPE = Symbol.for('react.context');
	var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
	var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
	var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
	var REACT_MEMO_TYPE = Symbol.for('react.memo');
	var REACT_LAZY_TYPE = Symbol.for('react.lazy');
	var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	var FAUX_ITERATOR_SYMBOL = '@@iterator';
	function getIteratorFn(maybeIterable) {
	  if (maybeIterable === null || typeof maybeIterable !== 'object') {
	    return null;
	  }

	  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

	  if (typeof maybeIterator === 'function') {
	    return maybeIterator;
	  }

	  return null;
	}

	var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

	function error(format) {
	  {
	    {
	      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      printWarning('error', format, args);
	    }
	  }
	}

	function printWarning(level, format, args) {
	  // When changing this logic, you might want to also
	  // update consoleWithStackDev.www.js as well.
	  {
	    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
	    var stack = ReactDebugCurrentFrame.getStackAddendum();

	    if (stack !== '') {
	      format += '%s';
	      args = args.concat([stack]);
	    } // eslint-disable-next-line react-internal/safe-string-coercion


	    var argsWithFormat = args.map(function (item) {
	      return String(item);
	    }); // Careful: RN currently depends on this prefix

	    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
	    // breaks IE9: https://github.com/facebook/react/issues/13610
	    // eslint-disable-next-line react-internal/no-production-logging

	    Function.prototype.apply.call(console[level], console, argsWithFormat);
	  }
	}

	// -----------------------------------------------------------------------------

	var enableScopeAPI = false; // Experimental Create Event Handle API.
	var enableCacheElement = false;
	var enableTransitionTracing = false; // No known bugs, but needs performance testing

	var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
	// stuff. Intended to enable React core members to more easily debug scheduling
	// issues in DEV builds.

	var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

	var REACT_MODULE_REFERENCE;

	{
	  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
	}

	function isValidElementType(type) {
	  if (typeof type === 'string' || typeof type === 'function') {
	    return true;
	  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


	  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
	    return true;
	  }

	  if (typeof type === 'object' && type !== null) {
	    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
	    // types supported by any Flight configuration anywhere since
	    // we don't know which Flight build this will end up being used
	    // with.
	    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
	      return true;
	    }
	  }

	  return false;
	}

	function getWrappedName(outerType, innerType, wrapperName) {
	  var displayName = outerType.displayName;

	  if (displayName) {
	    return displayName;
	  }

	  var functionName = innerType.displayName || innerType.name || '';
	  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
	} // Keep in sync with react-reconciler/getComponentNameFromFiber


	function getContextName(type) {
	  return type.displayName || 'Context';
	} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


	function getComponentNameFromType(type) {
	  if (type == null) {
	    // Host root, text node or just invalid type.
	    return null;
	  }

	  {
	    if (typeof type.tag === 'number') {
	      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
	    }
	  }

	  if (typeof type === 'function') {
	    return type.displayName || type.name || null;
	  }

	  if (typeof type === 'string') {
	    return type;
	  }

	  switch (type) {
	    case REACT_FRAGMENT_TYPE:
	      return 'Fragment';

	    case REACT_PORTAL_TYPE:
	      return 'Portal';

	    case REACT_PROFILER_TYPE:
	      return 'Profiler';

	    case REACT_STRICT_MODE_TYPE:
	      return 'StrictMode';

	    case REACT_SUSPENSE_TYPE:
	      return 'Suspense';

	    case REACT_SUSPENSE_LIST_TYPE:
	      return 'SuspenseList';

	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_CONTEXT_TYPE:
	        var context = type;
	        return getContextName(context) + '.Consumer';

	      case REACT_PROVIDER_TYPE:
	        var provider = type;
	        return getContextName(provider._context) + '.Provider';

	      case REACT_FORWARD_REF_TYPE:
	        return getWrappedName(type, type.render, 'ForwardRef');

	      case REACT_MEMO_TYPE:
	        var outerName = type.displayName || null;

	        if (outerName !== null) {
	          return outerName;
	        }

	        return getComponentNameFromType(type.type) || 'Memo';

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            return getComponentNameFromType(init(payload));
	          } catch (x) {
	            return null;
	          }
	        }

	      // eslint-disable-next-line no-fallthrough
	    }
	  }

	  return null;
	}

	var assign = Object.assign;

	// Helpers to patch console.logs to avoid logging during side-effect free
	// replaying on render function. This currently only patches the object
	// lazily which won't cover if the log function was extracted eagerly.
	// We could also eagerly patch the method.
	var disabledDepth = 0;
	var prevLog;
	var prevInfo;
	var prevWarn;
	var prevError;
	var prevGroup;
	var prevGroupCollapsed;
	var prevGroupEnd;

	function disabledLog() {}

	disabledLog.__reactDisabledLog = true;
	function disableLogs() {
	  {
	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      prevLog = console.log;
	      prevInfo = console.info;
	      prevWarn = console.warn;
	      prevError = console.error;
	      prevGroup = console.group;
	      prevGroupCollapsed = console.groupCollapsed;
	      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

	      var props = {
	        configurable: true,
	        enumerable: true,
	        value: disabledLog,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        info: props,
	        log: props,
	        warn: props,
	        error: props,
	        group: props,
	        groupCollapsed: props,
	        groupEnd: props
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    disabledDepth++;
	  }
	}
	function reenableLogs() {
	  {
	    disabledDepth--;

	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      var props = {
	        configurable: true,
	        enumerable: true,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        log: assign({}, props, {
	          value: prevLog
	        }),
	        info: assign({}, props, {
	          value: prevInfo
	        }),
	        warn: assign({}, props, {
	          value: prevWarn
	        }),
	        error: assign({}, props, {
	          value: prevError
	        }),
	        group: assign({}, props, {
	          value: prevGroup
	        }),
	        groupCollapsed: assign({}, props, {
	          value: prevGroupCollapsed
	        }),
	        groupEnd: assign({}, props, {
	          value: prevGroupEnd
	        })
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    if (disabledDepth < 0) {
	      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
	    }
	  }
	}

	var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
	var prefix;
	function describeBuiltInComponentFrame(name, source, ownerFn) {
	  {
	    if (prefix === undefined) {
	      // Extract the VM specific prefix used by each line.
	      try {
	        throw Error();
	      } catch (x) {
	        var match = x.stack.trim().match(/\n( *(at )?)/);
	        prefix = match && match[1] || '';
	      }
	    } // We use the prefix to ensure our stacks line up with native stack frames.


	    return '\n' + prefix + name;
	  }
	}
	var reentry = false;
	var componentFrameCache;

	{
	  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
	  componentFrameCache = new PossiblyWeakMap();
	}

	function describeNativeComponentFrame(fn, construct) {
	  // If something asked for a stack inside a fake render, it should get ignored.
	  if ( !fn || reentry) {
	    return '';
	  }

	  {
	    var frame = componentFrameCache.get(fn);

	    if (frame !== undefined) {
	      return frame;
	    }
	  }

	  var control;
	  reentry = true;
	  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

	  Error.prepareStackTrace = undefined;
	  var previousDispatcher;

	  {
	    previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
	    // for warnings.

	    ReactCurrentDispatcher.current = null;
	    disableLogs();
	  }

	  try {
	    // This should throw.
	    if (construct) {
	      // Something should be setting the props in the constructor.
	      var Fake = function () {
	        throw Error();
	      }; // $FlowFixMe


	      Object.defineProperty(Fake.prototype, 'props', {
	        set: function () {
	          // We use a throwing setter instead of frozen or non-writable props
	          // because that won't throw in a non-strict mode function.
	          throw Error();
	        }
	      });

	      if (typeof Reflect === 'object' && Reflect.construct) {
	        // We construct a different control for this case to include any extra
	        // frames added by the construct call.
	        try {
	          Reflect.construct(Fake, []);
	        } catch (x) {
	          control = x;
	        }

	        Reflect.construct(fn, [], Fake);
	      } else {
	        try {
	          Fake.call();
	        } catch (x) {
	          control = x;
	        }

	        fn.call(Fake.prototype);
	      }
	    } else {
	      try {
	        throw Error();
	      } catch (x) {
	        control = x;
	      }

	      fn();
	    }
	  } catch (sample) {
	    // This is inlined manually because closure doesn't do it for us.
	    if (sample && control && typeof sample.stack === 'string') {
	      // This extracts the first frame from the sample that isn't also in the control.
	      // Skipping one frame that we assume is the frame that calls the two.
	      var sampleLines = sample.stack.split('\n');
	      var controlLines = control.stack.split('\n');
	      var s = sampleLines.length - 1;
	      var c = controlLines.length - 1;

	      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
	        // We expect at least one stack frame to be shared.
	        // Typically this will be the root most one. However, stack frames may be
	        // cut off due to maximum stack limits. In this case, one maybe cut off
	        // earlier than the other. We assume that the sample is longer or the same
	        // and there for cut off earlier. So we should find the root most frame in
	        // the sample somewhere in the control.
	        c--;
	      }

	      for (; s >= 1 && c >= 0; s--, c--) {
	        // Next we find the first one that isn't the same which should be the
	        // frame that called our sample function and the control.
	        if (sampleLines[s] !== controlLines[c]) {
	          // In V8, the first line is describing the message but other VMs don't.
	          // If we're about to return the first line, and the control is also on the same
	          // line, that's a pretty good indicator that our sample threw at same line as
	          // the control. I.e. before we entered the sample frame. So we ignore this result.
	          // This can happen if you passed a class to function component, or non-function.
	          if (s !== 1 || c !== 1) {
	            do {
	              s--;
	              c--; // We may still have similar intermediate frames from the construct call.
	              // The next one that isn't the same should be our match though.

	              if (c < 0 || sampleLines[s] !== controlLines[c]) {
	                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
	                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
	                // but we have a user-provided "displayName"
	                // splice it in to make the stack more readable.


	                if (fn.displayName && _frame.includes('<anonymous>')) {
	                  _frame = _frame.replace('<anonymous>', fn.displayName);
	                }

	                {
	                  if (typeof fn === 'function') {
	                    componentFrameCache.set(fn, _frame);
	                  }
	                } // Return the line we found.


	                return _frame;
	              }
	            } while (s >= 1 && c >= 0);
	          }

	          break;
	        }
	      }
	    }
	  } finally {
	    reentry = false;

	    {
	      ReactCurrentDispatcher.current = previousDispatcher;
	      reenableLogs();
	    }

	    Error.prepareStackTrace = previousPrepareStackTrace;
	  } // Fallback to just using the name if we couldn't make it throw.


	  var name = fn ? fn.displayName || fn.name : '';
	  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

	  {
	    if (typeof fn === 'function') {
	      componentFrameCache.set(fn, syntheticFrame);
	    }
	  }

	  return syntheticFrame;
	}
	function describeFunctionComponentFrame(fn, source, ownerFn) {
	  {
	    return describeNativeComponentFrame(fn, false);
	  }
	}

	function shouldConstruct(Component) {
	  var prototype = Component.prototype;
	  return !!(prototype && prototype.isReactComponent);
	}

	function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

	  if (type == null) {
	    return '';
	  }

	  if (typeof type === 'function') {
	    {
	      return describeNativeComponentFrame(type, shouldConstruct(type));
	    }
	  }

	  if (typeof type === 'string') {
	    return describeBuiltInComponentFrame(type);
	  }

	  switch (type) {
	    case REACT_SUSPENSE_TYPE:
	      return describeBuiltInComponentFrame('Suspense');

	    case REACT_SUSPENSE_LIST_TYPE:
	      return describeBuiltInComponentFrame('SuspenseList');
	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_FORWARD_REF_TYPE:
	        return describeFunctionComponentFrame(type.render);

	      case REACT_MEMO_TYPE:
	        // Memo may contain any component type so we recursively resolve it.
	        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            // Lazy may contain any component type so we recursively resolve it.
	            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
	          } catch (x) {}
	        }
	    }
	  }

	  return '';
	}

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var loggedTypeFailures = {};
	var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame.setExtraStackFrame(null);
	    }
	  }
	}

	function checkPropTypes(typeSpecs, values, location, componentName, element) {
	  {
	    // $FlowFixMe This is okay but Flow doesn't know it.
	    var has = Function.call.bind(hasOwnProperty);

	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.

	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            // eslint-disable-next-line react-internal/prod-error-codes
	            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
	            err.name = 'Invariant Violation';
	            throw err;
	          }

	          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
	        } catch (ex) {
	          error$1 = ex;
	        }

	        if (error$1 && !(error$1 instanceof Error)) {
	          setCurrentlyValidatingElement(element);

	          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

	          setCurrentlyValidatingElement(null);
	        }

	        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error$1.message] = true;
	          setCurrentlyValidatingElement(element);

	          error('Failed %s type: %s', location, error$1.message);

	          setCurrentlyValidatingElement(null);
	        }
	      }
	    }
	  }
	}

	var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

	function isArray(a) {
	  return isArrayImpl(a);
	}

	/*
	 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
	 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
	 *
	 * The functions in this module will throw an easier-to-understand,
	 * easier-to-debug exception with a clear errors message message explaining the
	 * problem. (Instead of a confusing exception thrown inside the implementation
	 * of the `value` object).
	 */
	// $FlowFixMe only called in DEV, so void return is not possible.
	function typeName(value) {
	  {
	    // toStringTag is needed for namespaced types like Temporal.Instant
	    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
	    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
	    return type;
	  }
	} // $FlowFixMe only called in DEV, so void return is not possible.


	function willCoercionThrow(value) {
	  {
	    try {
	      testStringCoercion(value);
	      return false;
	    } catch (e) {
	      return true;
	    }
	  }
	}

	function testStringCoercion(value) {
	  // If you ended up here by following an exception call stack, here's what's
	  // happened: you supplied an object or symbol value to React (as a prop, key,
	  // DOM attribute, CSS property, string ref, etc.) and when React tried to
	  // coerce it to a string using `'' + value`, an exception was thrown.
	  //
	  // The most common types that will cause this exception are `Symbol` instances
	  // and Temporal objects like `Temporal.Instant`. But any object that has a
	  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
	  // exception. (Library authors do this to prevent users from using built-in
	  // numeric operators like `+` or comparison operators like `>=` because custom
	  // methods are needed to perform accurate arithmetic or comparison.)
	  //
	  // To fix the problem, coerce this object or symbol value to a string before
	  // passing it to React. The most reliable way is usually `String(value)`.
	  //
	  // To find which value is throwing, check the browser or debugger console.
	  // Before this exception was thrown, there should be `console.error` output
	  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
	  // problem and how that type was used: key, atrribute, input value prop, etc.
	  // In most cases, this console output also shows the component and its
	  // ancestor components where the exception happened.
	  //
	  // eslint-disable-next-line react-internal/safe-string-coercion
	  return '' + value;
	}
	function checkKeyStringCoercion(value) {
	  {
	    if (willCoercionThrow(value)) {
	      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

	      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
	    }
	  }
	}

	var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
	var RESERVED_PROPS = {
	  key: true,
	  ref: true,
	  __self: true,
	  __source: true
	};
	var specialPropKeyWarningShown;
	var specialPropRefWarningShown;

	function hasValidRef(config) {
	  {
	    if (hasOwnProperty.call(config, 'ref')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.ref !== undefined;
	}

	function hasValidKey(config) {
	  {
	    if (hasOwnProperty.call(config, 'key')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.key !== undefined;
	}

	function warnIfStringRefCannotBeAutoConverted(config, self) {
	  {
	    if (typeof config.ref === 'string' && ReactCurrentOwner.current && self) ;
	  }
	}

	function defineKeyPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingKey = function () {
	      if (!specialPropKeyWarningShown) {
	        specialPropKeyWarningShown = true;

	        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingKey.isReactWarning = true;
	    Object.defineProperty(props, 'key', {
	      get: warnAboutAccessingKey,
	      configurable: true
	    });
	  }
	}

	function defineRefPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingRef = function () {
	      if (!specialPropRefWarningShown) {
	        specialPropRefWarningShown = true;

	        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingRef.isReactWarning = true;
	    Object.defineProperty(props, 'ref', {
	      get: warnAboutAccessingRef,
	      configurable: true
	    });
	  }
	}
	/**
	 * Factory method to create a new React element. This no longer adheres to
	 * the class pattern, so do not use new to call it. Also, instanceof check
	 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
	 * if something is a React Element.
	 *
	 * @param {*} type
	 * @param {*} props
	 * @param {*} key
	 * @param {string|object} ref
	 * @param {*} owner
	 * @param {*} self A *temporary* helper to detect places where `this` is
	 * different from the `owner` when React.createElement is called, so that we
	 * can warn. We want to get rid of owner and replace string `ref`s with arrow
	 * functions, and as long as `this` and owner are the same, there will be no
	 * change in behavior.
	 * @param {*} source An annotation object (added by a transpiler or otherwise)
	 * indicating filename, line number, and/or other information.
	 * @internal
	 */


	var ReactElement = function (type, key, ref, self, source, owner, props) {
	  var element = {
	    // This tag allows us to uniquely identify this as a React Element
	    $$typeof: REACT_ELEMENT_TYPE,
	    // Built-in properties that belong on the element
	    type: type,
	    key: key,
	    ref: ref,
	    props: props,
	    // Record the component responsible for creating this element.
	    _owner: owner
	  };

	  {
	    // The validation flag is currently mutative. We put it on
	    // an external backing store so that we can freeze the whole object.
	    // This can be replaced with a WeakMap once they are implemented in
	    // commonly used development environments.
	    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
	    // the validation flag non-enumerable (where possible, which should
	    // include every environment we run tests in), so the test framework
	    // ignores it.

	    Object.defineProperty(element._store, 'validated', {
	      configurable: false,
	      enumerable: false,
	      writable: true,
	      value: false
	    }); // self and source are DEV only properties.

	    Object.defineProperty(element, '_self', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: self
	    }); // Two elements created in two different places should be considered
	    // equal for testing purposes and therefore we hide it from enumeration.

	    Object.defineProperty(element, '_source', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: source
	    });

	    if (Object.freeze) {
	      Object.freeze(element.props);
	      Object.freeze(element);
	    }
	  }

	  return element;
	};
	/**
	 * https://github.com/reactjs/rfcs/pull/107
	 * @param {*} type
	 * @param {object} props
	 * @param {string} key
	 */

	function jsxDEV(type, config, maybeKey, source, self) {
	  {
	    var propName; // Reserved names are extracted

	    var props = {};
	    var key = null;
	    var ref = null; // Currently, key can be spread in as a prop. This causes a potential
	    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
	    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
	    // but as an intermediary step, we will use jsxDEV for everything except
	    // <div {...props} key="Hi" />, because we aren't currently able to tell if
	    // key is explicitly declared to be undefined or not.

	    if (maybeKey !== undefined) {
	      {
	        checkKeyStringCoercion(maybeKey);
	      }

	      key = '' + maybeKey;
	    }

	    if (hasValidKey(config)) {
	      {
	        checkKeyStringCoercion(config.key);
	      }

	      key = '' + config.key;
	    }

	    if (hasValidRef(config)) {
	      ref = config.ref;
	      warnIfStringRefCannotBeAutoConverted(config, self);
	    } // Remaining properties are added to a new props object


	    for (propName in config) {
	      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
	        props[propName] = config[propName];
	      }
	    } // Resolve default props


	    if (type && type.defaultProps) {
	      var defaultProps = type.defaultProps;

	      for (propName in defaultProps) {
	        if (props[propName] === undefined) {
	          props[propName] = defaultProps[propName];
	        }
	      }
	    }

	    if (key || ref) {
	      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

	      if (key) {
	        defineKeyPropWarningGetter(props, displayName);
	      }

	      if (ref) {
	        defineRefPropWarningGetter(props, displayName);
	      }
	    }

	    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
	  }
	}

	var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
	var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement$1(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
	    }
	  }
	}

	var propTypesMisspellWarningShown;

	{
	  propTypesMisspellWarningShown = false;
	}
	/**
	 * Verifies the object is a ReactElement.
	 * See https://reactjs.org/docs/react-api.html#isvalidelement
	 * @param {?object} object
	 * @return {boolean} True if `object` is a ReactElement.
	 * @final
	 */


	function isValidElement(object) {
	  {
	    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	  }
	}

	function getDeclarationErrorAddendum() {
	  {
	    if (ReactCurrentOwner$1.current) {
	      var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);

	      if (name) {
	        return '\n\nCheck the render method of `' + name + '`.';
	      }
	    }

	    return '';
	  }
	}

	function getSourceInfoErrorAddendum(source) {
	  {

	    return '';
	  }
	}
	/**
	 * Warn if there's no key explicitly set on dynamic arrays of children or
	 * object keys are not valid. This allows us to keep track of children between
	 * updates.
	 */


	var ownerHasKeyUseWarning = {};

	function getCurrentComponentErrorInfo(parentType) {
	  {
	    var info = getDeclarationErrorAddendum();

	    if (!info) {
	      var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

	      if (parentName) {
	        info = "\n\nCheck the top-level render call using <" + parentName + ">.";
	      }
	    }

	    return info;
	  }
	}
	/**
	 * Warn if the element doesn't have an explicit key assigned to it.
	 * This element is in an array. The array could grow and shrink or be
	 * reordered. All children that haven't already been validated are required to
	 * have a "key" property assigned to it. Error statuses are cached so a warning
	 * will only be shown once.
	 *
	 * @internal
	 * @param {ReactElement} element Element that requires a key.
	 * @param {*} parentType element's parent's type.
	 */


	function validateExplicitKey(element, parentType) {
	  {
	    if (!element._store || element._store.validated || element.key != null) {
	      return;
	    }

	    element._store.validated = true;
	    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

	    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
	      return;
	    }

	    ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
	    // property, it may be the creator of the child that's responsible for
	    // assigning it a key.

	    var childOwner = '';

	    if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
	      // Give the component that originally created this child.
	      childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
	    }

	    setCurrentlyValidatingElement$1(element);

	    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

	    setCurrentlyValidatingElement$1(null);
	  }
	}
	/**
	 * Ensure that every element either is passed in a static location, in an
	 * array with an explicit keys property defined, or in an object literal
	 * with valid key property.
	 *
	 * @internal
	 * @param {ReactNode} node Statically passed child of any type.
	 * @param {*} parentType node's parent's type.
	 */


	function validateChildKeys(node, parentType) {
	  {
	    if (typeof node !== 'object') {
	      return;
	    }

	    if (isArray(node)) {
	      for (var i = 0; i < node.length; i++) {
	        var child = node[i];

	        if (isValidElement(child)) {
	          validateExplicitKey(child, parentType);
	        }
	      }
	    } else if (isValidElement(node)) {
	      // This element was passed in a valid location.
	      if (node._store) {
	        node._store.validated = true;
	      }
	    } else if (node) {
	      var iteratorFn = getIteratorFn(node);

	      if (typeof iteratorFn === 'function') {
	        // Entry iterators used to provide implicit keys,
	        // but now we print a separate warning for them later.
	        if (iteratorFn !== node.entries) {
	          var iterator = iteratorFn.call(node);
	          var step;

	          while (!(step = iterator.next()).done) {
	            if (isValidElement(step.value)) {
	              validateExplicitKey(step.value, parentType);
	            }
	          }
	        }
	      }
	    }
	  }
	}
	/**
	 * Given an element, validate that its props follow the propTypes definition,
	 * provided by the type.
	 *
	 * @param {ReactElement} element
	 */


	function validatePropTypes(element) {
	  {
	    var type = element.type;

	    if (type === null || type === undefined || typeof type === 'string') {
	      return;
	    }

	    var propTypes;

	    if (typeof type === 'function') {
	      propTypes = type.propTypes;
	    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
	    // Inner props are checked in the reconciler.
	    type.$$typeof === REACT_MEMO_TYPE)) {
	      propTypes = type.propTypes;
	    } else {
	      return;
	    }

	    if (propTypes) {
	      // Intentionally inside to avoid triggering lazy initializers:
	      var name = getComponentNameFromType(type);
	      checkPropTypes(propTypes, element.props, 'prop', name, element);
	    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
	      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

	      var _name = getComponentNameFromType(type);

	      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
	    }

	    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
	      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
	    }
	  }
	}
	/**
	 * Given a fragment, validate that it can only be provided with fragment props
	 * @param {ReactElement} fragment
	 */


	function validateFragmentProps(fragment) {
	  {
	    var keys = Object.keys(fragment.props);

	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];

	      if (key !== 'children' && key !== 'key') {
	        setCurrentlyValidatingElement$1(fragment);

	        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

	        setCurrentlyValidatingElement$1(null);
	        break;
	      }
	    }

	    if (fragment.ref !== null) {
	      setCurrentlyValidatingElement$1(fragment);

	      error('Invalid attribute `ref` supplied to `React.Fragment`.');

	      setCurrentlyValidatingElement$1(null);
	    }
	  }
	}

	var didWarnAboutKeySpread = {};
	function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
	  {
	    var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
	    // succeed and there will likely be errors in render.

	    if (!validType) {
	      var info = '';

	      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
	        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
	      }

	      var sourceInfo = getSourceInfoErrorAddendum();

	      if (sourceInfo) {
	        info += sourceInfo;
	      } else {
	        info += getDeclarationErrorAddendum();
	      }

	      var typeString;

	      if (type === null) {
	        typeString = 'null';
	      } else if (isArray(type)) {
	        typeString = 'array';
	      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
	        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
	        info = ' Did you accidentally export a JSX literal instead of a component?';
	      } else {
	        typeString = typeof type;
	      }

	      error('React.jsx: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
	    }

	    var element = jsxDEV(type, props, key, source, self); // The result can be nullish if a mock or a custom function is used.
	    // TODO: Drop this when these are no longer allowed as the type argument.

	    if (element == null) {
	      return element;
	    } // Skip key warning if the type isn't valid since our key validation logic
	    // doesn't expect a non-string/function type and can throw confusing errors.
	    // We don't want exception behavior to differ between dev and prod.
	    // (Rendering will throw with a helpful message and as soon as the type is
	    // fixed, the key warnings will appear.)


	    if (validType) {
	      var children = props.children;

	      if (children !== undefined) {
	        if (isStaticChildren) {
	          if (isArray(children)) {
	            for (var i = 0; i < children.length; i++) {
	              validateChildKeys(children[i], type);
	            }

	            if (Object.freeze) {
	              Object.freeze(children);
	            }
	          } else {
	            error('React.jsx: Static children should always be an array. ' + 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' + 'Use the Babel transform instead.');
	          }
	        } else {
	          validateChildKeys(children, type);
	        }
	      }
	    }

	    {
	      if (hasOwnProperty.call(props, 'key')) {
	        var componentName = getComponentNameFromType(type);
	        var keys = Object.keys(props).filter(function (k) {
	          return k !== 'key';
	        });
	        var beforeExample = keys.length > 0 ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}' : '{key: someKey}';

	        if (!didWarnAboutKeySpread[componentName + beforeExample]) {
	          var afterExample = keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';

	          error('A props object containing a "key" prop is being spread into JSX:\n' + '  let props = %s;\n' + '  <%s {...props} />\n' + 'React keys must be passed directly to JSX without using spread:\n' + '  let props = %s;\n' + '  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);

	          didWarnAboutKeySpread[componentName + beforeExample] = true;
	        }
	      }
	    }

	    if (type === REACT_FRAGMENT_TYPE) {
	      validateFragmentProps(element);
	    } else {
	      validatePropTypes(element);
	    }

	    return element;
	  }
	} // These two functions exist to still get child warnings in dev
	// even with the prod transform. This means that jsxDEV is purely
	// opt-in behavior for better messages but that we won't stop
	// giving you warnings if you use production apis.

	function jsxWithValidationStatic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, true);
	  }
	}
	function jsxWithValidationDynamic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, false);
	  }
	}

	var jsx =  jsxWithValidationDynamic ; // we may want to special case jsxs internally to take advantage of static children.
	// for now we can ship identical prod functions

	var jsxs =  jsxWithValidationStatic ;

	reactJsxRuntime_development.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_development.jsx = jsx;
	reactJsxRuntime_development.jsxs = jsxs;
	  })();
	}
	return reactJsxRuntime_development;
}

if (process.env.NODE_ENV === 'production') {
  jsxRuntime.exports = requireReactJsxRuntime_production_min();
} else {
  jsxRuntime.exports = requireReactJsxRuntime_development();
}

var jsxRuntimeExports = jsxRuntime.exports;

/**
 * Efficient file loader for Lottie animations
 * Supports both .json and .lottie formats with caching and retry logic
 */
class LottieLoader {
    /**
     * Load Lottie animation from URL
     */
    static async load(url, options = {}) {
        const cacheKey = this.getCacheKey(url, options);
        // Return cached result if available
        if (options.cache !== false && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const loadPromise = this.performLoad(url, {
            url,
            method: "GET",
            timeout: this.DEFAULT_TIMEOUT,
            retry: this.DEFAULT_RETRY,
            cache: true,
            ...options,
        });
        // Cache the promise if caching is enabled
        if (options.cache !== false) {
            this.cache.set(cacheKey, loadPromise);
        }
        return loadPromise;
    }
    /**
     * Load animation data from various sources
     */
    static async loadFromSource(source) {
        const startTime = performance.now();
        if (typeof source === "string") {
            // URL or JSON string
            if (this.isUrl(source)) {
                return this.load(source);
            }
            else {
                // JSON string
                return {
                    data: source,
                    format: "json",
                    size: source.length,
                    loadTime: performance.now() - startTime,
                };
            }
        }
        else if (source instanceof ArrayBuffer) {
            // Binary data (.lottie file)
            return {
                data: source,
                format: "lottie",
                size: source.byteLength,
                loadTime: performance.now() - startTime,
            };
        }
        else if (typeof source === "object") {
            // Animation data object
            const jsonString = JSON.stringify(source);
            return {
                data: jsonString,
                format: "json",
                size: jsonString.length,
                loadTime: performance.now() - startTime,
            };
        }
        throw new Error("Unsupported source type");
    }
    /**
     * Preload animations for better performance
     */
    static async preload(urls, options = {}) {
        const loadPromises = urls.map((url) => this.load(url, options));
        return Promise.all(loadPromises);
    }
    /**
     * Clear cache to free memory
     */
    static clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache size information
     */
    static getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
    /**
     * Remove specific item from cache
     */
    static removeCacheItem(url, options = {}) {
        const cacheKey = this.getCacheKey(url, options);
        return this.cache.delete(cacheKey);
    }
    /**
     * Perform the actual load operation
     */
    static async performLoad(url, options) {
        const startTime = performance.now();
        let lastError = null;
        const retryCount = options.retry || this.DEFAULT_RETRY;
        for (let attempt = 0; attempt < retryCount; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const format = this.detectFormat(url, response);
                let data;
                let size;
                if (format === "lottie") {
                    data = await response.arrayBuffer();
                    size = data.byteLength;
                }
                else {
                    data = await response.text();
                    size = data.length;
                }
                return {
                    data,
                    format,
                    size,
                    loadTime: performance.now() - startTime,
                };
            }
            catch (error) {
                lastError = error;
                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    break;
                }
                // Wait before retrying (exponential backoff)
                if (attempt < retryCount - 1) {
                    await this.delay(Math.pow(2, attempt) * 100);
                }
            }
        }
        throw lastError || new Error("Failed to load animation");
    }
    /**
     * Fetch with timeout support
     */
    static async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        try {
            const response = await fetch(url, {
                method: options.method,
                headers: options.headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error(`Request timeout after ${options.timeout}ms`);
            }
            throw error;
        }
    }
    /**
     * Detect file format from URL and response
     */
    static detectFormat(url, response) {
        // Check file extension
        const urlLower = url.toLowerCase();
        if (urlLower.endsWith(".lottie")) {
            return "lottie";
        }
        if (urlLower.endsWith(".json")) {
            return "json";
        }
        // Check content type
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return "json";
        }
        if (contentType.includes("application/octet-stream") ||
            contentType.includes("application/zip")) {
            return "lottie";
        }
        // Default to JSON for unknown types
        return "json";
    }
    /**
     * Check if string is a URL
     */
    static isUrl(str) {
        try {
            new URL(str);
            return true;
        }
        catch (_a) {
            // Check for relative URLs
            return (str.startsWith("/") || str.startsWith("./") || str.startsWith("../"));
        }
    }
    /**
     * Check if error should not be retried
     */
    static isNonRetryableError(error) {
        const message = error.message.toLowerCase();
        return (message.includes("404") ||
            message.includes("403") ||
            message.includes("401") ||
            message.includes("syntax error") ||
            message.includes("invalid json"));
    }
    /**
     * Create cache key from URL and options
     */
    static getCacheKey(url, options) {
        const relevantOptions = {
            method: options.method || "GET",
            headers: options.headers || {},
        };
        return `${url}:${JSON.stringify(relevantOptions)}`;
    }
    /**
     * Delay helper for retry logic
     */
    static delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Validate loaded animation data
     */
    static validateAnimationData(data, format) {
        try {
            if (format === "json") {
                const parsed = JSON.parse(data);
                return this.isValidLottieJson(parsed);
            }
            else {
                return this.isValidLottieFile(data);
            }
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Check if JSON data is valid Lottie format
     */
    static isValidLottieJson(data) {
        return (typeof data === "object" &&
            data !== null &&
            typeof data.v === "string" &&
            typeof data.w === "number" &&
            typeof data.h === "number" &&
            Array.isArray(data.layers));
    }
    /**
     * Check if binary data is valid .lottie file
     */
    static isValidLottieFile(data) {
        if (data.byteLength < 4)
            return false;
        const header = new Uint8Array(data.slice(0, 4));
        const zipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
        return header.every((byte, index) => byte === zipSignature[index]);
    }
    /**
     * Get file size in human readable format
     */
    static formatFileSize(bytes) {
        const units = ["B", "KB", "MB", "GB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    /**
     * Estimate animation complexity
     */
    static estimateComplexity(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            }
            catch (_a) {
                return "low";
            }
        }
        if (!data || !Array.isArray(data.layers)) {
            return "low";
        }
        const layerCount = data.layers.length;
        const totalShapes = data.layers.reduce((total, layer) => {
            return total + (layer.shapes ? layer.shapes.length : 0);
        }, 0);
        if (layerCount < 5 && totalShapes < 10) {
            return "low";
        }
        else if (layerCount < 20 && totalShapes < 50) {
            return "medium";
        }
        else {
            return "high";
        }
    }
    /**
     * Optimize animation data for better performance
     */
    static optimizeForPerformance(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            }
            catch (_a) {
                return data;
            }
        }
        const optimized = JSON.parse(JSON.stringify(data));
        // Remove unused assets
        if (optimized.assets) {
            const usedAssets = new Set();
            const findUsedAssets = (layers) => {
                layers.forEach((layer) => {
                    if (layer.refId)
                        usedAssets.add(layer.refId);
                    if (layer.layers)
                        findUsedAssets(layer.layers);
                });
            };
            findUsedAssets(optimized.layers);
            optimized.assets = optimized.assets.filter((asset) => usedAssets.has(asset.id));
        }
        // Round numbers to reduce precision
        this.roundNumbers(optimized, 2);
        return optimized;
    }
    /**
     * Round numbers in object to reduce file size
     */
    static roundNumbers(obj, precision = 2) {
        if (typeof obj === "number") {
            return (Math.round(obj * Math.pow(10, precision)) / Math.pow(10, precision));
        }
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                if (typeof item === "number") {
                    obj[index] =
                        Math.round(item * Math.pow(10, precision)) /
                            Math.pow(10, precision);
                }
                else if (typeof item === "object" && item !== null) {
                    this.roundNumbers(item, precision);
                }
            });
        }
        else if (typeof obj === "object" && obj !== null) {
            Object.keys(obj).forEach((key) => {
                if (typeof obj[key] === "number") {
                    obj[key] =
                        Math.round(obj[key] * Math.pow(10, precision)) /
                            Math.pow(10, precision);
                }
                else if (typeof obj[key] === "object") {
                    this.roundNumbers(obj[key], precision);
                }
            });
        }
    }
}
LottieLoader.cache = new Map();
LottieLoader.DEFAULT_TIMEOUT = 10000; // 10 seconds
LottieLoader.DEFAULT_RETRY = 3;

/**
 * Performance monitoring and optimization utilities
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            parseTime: 0,
            renderTime: 0,
            frameTime: 0,
            memoryUsage: 0,
            fps: 0,
        };
        this.frameTimeHistory = [];
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.isMonitoring = false;
    }
    /**
     * Start performance monitoring
     */
    start() {
        this.isMonitoring = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.frameTimeHistory = [];
    }
    /**
     * Stop performance monitoring
     */
    stop() {
        this.isMonitoring = false;
    }
    /**
     * Record frame render time
     */
    recordFrame() {
        if (!this.isMonitoring)
            return;
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        this.frameTimeHistory.push(frameTime);
        this.lastFrameTime = currentTime;
        this.frameCount++;
        // Keep only last 60 frames for FPS calculation
        if (this.frameTimeHistory.length > 60) {
            this.frameTimeHistory.shift();
        }
        // Update metrics
        this.updateMetrics(frameTime);
    }
    /**
     * Record parse time
     */
    recordParseTime(time) {
        this.metrics.parseTime = time;
    }
    /**
     * Record render time
     */
    recordRenderTime(time) {
        this.metrics.renderTime = time;
    }
    /**
     * Update performance metrics
     */
    updateMetrics(frameTime) {
        this.metrics.frameTime = frameTime;
        // Calculate FPS from frame time history
        if (this.frameTimeHistory.length > 0) {
            const averageFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) /
                this.frameTimeHistory.length;
            this.metrics.fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
        }
        // Update memory usage if available
        if ("memory" in performance) {
            const memInfo = performance.memory;
            this.metrics.memoryUsage = memInfo.usedJSHeapSize;
        }
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get performance report
     */
    getReport() {
        const metrics = this.getMetrics();
        return `
Performance Report:
- Parse Time: ${metrics.parseTime.toFixed(2)}ms
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Frame Time: ${metrics.frameTime.toFixed(2)}ms
- FPS: ${metrics.fps.toFixed(1)}
- Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
    `.trim();
    }
    /**
     * Check if performance is good
     */
    isPerformanceGood() {
        const metrics = this.getMetrics();
        return metrics.fps >= 55 && metrics.frameTime <= 18; // Target 60fps (16.67ms per frame)
    }
    /**
     * Get performance grade
     */
    getPerformanceGrade() {
        const metrics = this.getMetrics();
        if (metrics.fps >= 58)
            return "A";
        if (metrics.fps >= 45)
            return "B";
        if (metrics.fps >= 30)
            return "C";
        if (metrics.fps >= 20)
            return "D";
        return "F";
    }
}
/**
 * Intersection Observer for lazy loading animations
 */
class LazyLoadManager {
    constructor(options = {}) {
        this.observer = null;
        this.callbacks = new Map();
        if ("IntersectionObserver" in window) {
            this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), {
                rootMargin: "50px",
                threshold: 0.1,
                ...options,
            });
        }
    }
    /**
     * Observe element for lazy loading
     */
    observe(element, callback) {
        if (!this.observer) {
            // Fallback for browsers without IntersectionObserver
            callback();
            return;
        }
        this.callbacks.set(element, callback);
        this.observer.observe(element);
    }
    /**
     * Stop observing element
     */
    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
        }
        this.callbacks.delete(element);
    }
    /**
     * Handle intersection changes
     */
    handleIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const callback = this.callbacks.get(entry.target);
                if (callback) {
                    callback();
                    this.unobserve(entry.target);
                }
            }
        });
    }
    /**
     * Destroy observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.callbacks.clear();
    }
}
/**
 * Frame rate limiting for battery optimization
 */
class FrameRateLimiter {
    constructor(targetFps = 60) {
        this.lastFrameTime = 0;
        this.targetFps = targetFps;
        this.frameInterval = 1000 / targetFps;
    }
    /**
     * Check if enough time has passed for next frame
     */
    shouldRender(currentTime = performance.now()) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
            return true;
        }
        return false;
    }
    /**
     * Set target FPS
     */
    setTargetFps(fps) {
        this.targetFps = Math.max(1, Math.min(120, fps));
        this.frameInterval = 1000 / this.targetFps;
    }
    /**
     * Get target FPS
     */
    getTargetFps() {
        return this.targetFps;
    }
}
/**
 * Memory usage monitor
 */
class MemoryMonitor {
    constructor() {
        this.samples = [];
        this.maxSamples = 100;
    }
    /**
     * Record current memory usage
     */
    sample() {
        if ("memory" in performance) {
            const memInfo = performance.memory;
            this.samples.push(memInfo.usedJSHeapSize);
            if (this.samples.length > this.maxSamples) {
                this.samples.shift();
            }
        }
    }
    /**
     * Get current memory usage in MB
     */
    getCurrentUsage() {
        if ("memory" in performance) {
            const memInfo = performance.memory;
            return memInfo.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
    }
    /**
     * Get average memory usage
     */
    getAverageUsage() {
        if (this.samples.length === 0)
            return 0;
        const sum = this.samples.reduce((total, sample) => total + sample, 0);
        return sum / this.samples.length / 1024 / 1024;
    }
    /**
     * Get peak memory usage
     */
    getPeakUsage() {
        if (this.samples.length === 0)
            return 0;
        return Math.max(...this.samples) / 1024 / 1024;
    }
    /**
     * Check if memory usage is high
     */
    isMemoryUsageHigh() {
        const currentUsage = this.getCurrentUsage();
        return currentUsage > 100; // More than 100MB
    }
    /**
     * Clear samples
     */
    clear() {
        this.samples = [];
    }
}
/**
 * Device performance detection
 */
class DeviceDetector {
    constructor() {
        this.performanceClass = null;
    }
    static getInstance() {
        if (!DeviceDetector.instance) {
            DeviceDetector.instance = new DeviceDetector();
        }
        return DeviceDetector.instance;
    }
    /**
     * Detect device performance class
     */
    async detectPerformance() {
        if (this.performanceClass) {
            return this.performanceClass;
        }
        // Test rendering performance
        const renderScore = await this.testRenderPerformance();
        // Check device specs
        const deviceScore = this.getDeviceScore();
        // Combine scores
        const totalScore = (renderScore + deviceScore) / 2;
        if (totalScore >= 0.8) {
            this.performanceClass = "high";
        }
        else if (totalScore >= 0.5) {
            this.performanceClass = "medium";
        }
        else {
            this.performanceClass = "low";
        }
        return this.performanceClass;
    }
    /**
     * Test rendering performance
     */
    async testRenderPerformance() {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext("2d");
            const startTime = performance.now();
            let frameCount = 0;
            const testDuration = 100; // 100ms test
            const animate = () => {
                // Simple animation test
                ctx.clearRect(0, 0, 300, 300);
                ctx.fillStyle = `hsl(${frameCount * 10}, 50%, 50%)`;
                ctx.fillRect(frameCount % 300, 50, 50, 50);
                frameCount++;
                if (performance.now() - startTime < testDuration) {
                    requestAnimationFrame(animate);
                }
                else {
                    const fps = frameCount / (testDuration / 1000);
                    const score = Math.min(fps / 60, 1); // Normalize to 0-1
                    resolve(score);
                }
            };
            requestAnimationFrame(animate);
        });
    }
    /**
     * Get device performance score based on specs
     */
    getDeviceScore() {
        let score = 0.5; // Base score
        // Check CPU cores
        if ("hardwareConcurrency" in navigator) {
            const cores = navigator.hardwareConcurrency;
            score += Math.min(cores / 8, 0.3); // Up to 8 cores = +0.3
        }
        // Check memory
        if ("memory" in performance) {
            const memInfo = performance.memory;
            const totalMemoryMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
            score += Math.min(totalMemoryMB / 1024, 0.2); // Up to 1GB = +0.2
        }
        // Check device pixel ratio (higher = more work)
        const dpr = window.devicePixelRatio || 1;
        if (dpr <= 1) {
            score += 0.1;
        }
        else if (dpr >= 3) {
            score -= 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    /**
     * Check if device supports hardware acceleration
     */
    supportsHardwareAcceleration() {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!gl;
    }
    /**
     * Get recommended settings based on device performance
     */
    getRecommendedSettings() {
        const performanceClass = this.performanceClass || "medium";
        const isMobile = this.isMobile();
        switch (performanceClass) {
            case "high":
                return {
                    renderer: "canvas",
                    quality: "high",
                    maxFps: 60,
                    enableSubFrames: true,
                };
            case "medium":
                return {
                    renderer: "canvas",
                    quality: "medium",
                    maxFps: isMobile ? 30 : 45,
                    enableSubFrames: false,
                };
            case "low":
            default:
                return {
                    renderer: "svg",
                    quality: "low",
                    maxFps: 24,
                    enableSubFrames: false,
                };
        }
    }
}
/**
 * Animation optimization utilities
 */
class OptimizationUtils {
    /**
     * Debounce function for resize events
     */
    static debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    /**
     * Throttle function for scroll events
     */
    static throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }
    /**
     * Request idle callback polyfill
     */
    static requestIdleCallback(callback, timeout = 5000) {
        if ("requestIdleCallback" in window) {
            return window.requestIdleCallback(callback, { timeout });
        }
        else {
            return setTimeout(callback, 16);
        }
    }
    /**
     * Cancel idle callback polyfill
     */
    static cancelIdleCallback(id) {
        if ("cancelIdleCallback" in window) {
            window.cancelIdleCallback(id);
        }
        else {
            clearTimeout(id);
        }
    }
    /**
     * Check if reduced motion is preferred
     */
    static prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    /**
     * Check if device is in power save mode
     */
    static isInPowerSaveMode() {
        // This is a heuristic based on frame rate
        const testStart = performance.now();
        let frameCount = 0;
        return new Promise((resolve) => {
            const measure = () => {
                frameCount++;
                if (performance.now() - testStart < 100) {
                    requestAnimationFrame(measure);
                }
                else {
                    const fps = frameCount / 0.1; // frames per second
                    resolve(fps < 30); // Consider < 30fps as power save mode
                }
            };
            requestAnimationFrame(measure);
        });
    }
}

/**
 * Ultra-lightweight React Lottie player component
 * Supports both .json and .lottie formats with zero dependencies
 */
const LottiePlayer = forwardRef(({ src, autoplay = true, loop = true, renderer = "canvas", speed = 1, direction = 1, segments, style, className, onComplete, onProgress, onError, onLoad, preserveAspectRatio: _preserveAspectRatio = "xMidYMid meet", // TODO: Apply to SVG renderer
rendererSettings = {}, }, ref) => {
    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    // Expose methods through ref
    useImperativeHandle(ref, () => ({
        play: () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.play(); },
        pause: () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.pause(); },
        stop: () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop(); },
        seek: (progress) => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.seek(progress); },
        getCurrentFrame: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.getCurrentFrame()) || 0; },
        getTotalFrames: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.getTotalFrames()) || 0; },
        getProgress: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.getProgress()) || 0; },
        isPlaying: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.isPlaying()) || false; },
        isPaused: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.isPaused()) || false; },
        isStopped: () => { var _a; return ((_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.isStopped()) || true; },
    }), []);
    // Lazy loading with Intersection Observer
    useEffect(() => {
        if (!containerRef.current)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: "50px", threshold: 0.1 });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);
    // Load and initialize animation
    useEffect(() => {
        if (!isVisible || !containerRef.current)
            return;
        let isCancelled = false;
        const loadAnimation = async () => {
            try {
                setError(null);
                // Load animation data
                const loaderResult = await LottieLoader.loadFromSource(src);
                if (isCancelled)
                    return;
                // Parse animation data
                const parsedAnimation = await LottieParser.parse({
                    data: loaderResult.data,
                    format: loaderResult.format,
                });
                if (isCancelled)
                    return;
                // Optimize animation data based on device performance
                const deviceDetector = DeviceDetector.getInstance();
                const performanceClass = await deviceDetector.detectPerformance();
                const recommendedSettings = deviceDetector.getRecommendedSettings();
                // Use recommended renderer if device is low-end
                const finalRenderer = performanceClass === "low"
                    ? recommendedSettings.renderer
                    : renderer;
                // Create animation instance
                const animation = new Animation({
                    container: containerRef.current,
                    renderer: finalRenderer,
                    loop,
                    autoplay,
                    animationData: parsedAnimation.data,
                    rendererSettings,
                });
                if (isCancelled) {
                    animation.destroy();
                    return;
                }
                // Configure animation
                animation.setSpeed(speed);
                animation.setDirection(direction);
                if (segments) {
                    animation.playSegments(segments);
                }
                // Set up event listeners
                if (onComplete) {
                    animation.addEventListener("complete", onComplete);
                }
                if (onProgress) {
                    animation.addEventListener("enterFrame", () => {
                        onProgress(animation.getProgress());
                    });
                }
                // Store animation reference
                animationRef.current = animation;
                setIsLoaded(true);
                if (onLoad) {
                    onLoad();
                }
            }
            catch (err) {
                if (!isCancelled) {
                    const error = err instanceof Error
                        ? err
                        : new Error("Failed to load animation");
                    setError(error);
                    if (onError) {
                        onError(error);
                    }
                }
            }
        };
        loadAnimation();
        return () => {
            isCancelled = true;
            if (animationRef.current) {
                animationRef.current.destroy();
                animationRef.current = null;
            }
        };
    }, [
        isVisible,
        src,
        autoplay,
        loop,
        renderer,
        rendererSettings,
        onLoad,
        onError,
    ]);
    // Update animation properties when they change
    useEffect(() => {
        if (!animationRef.current)
            return;
        animationRef.current.setSpeed(speed);
    }, [speed]);
    useEffect(() => {
        if (!animationRef.current)
            return;
        animationRef.current.setDirection(direction);
    }, [direction]);
    useEffect(() => {
        if (!animationRef.current)
            return;
        if (segments) {
            animationRef.current.playSegments(segments);
        }
        else {
            animationRef.current.clearSegments();
        }
    }, [segments]);
    // Handle resize events
    useEffect(() => {
        const handleResize = OptimizationUtils.debounce(() => {
            if (animationRef.current) {
                animationRef.current.resize();
            }
        }, 100);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    // Handle visibility change for performance
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!animationRef.current)
                return;
            if (document.hidden) {
                // Pause animation when tab is not visible
                if (animationRef.current.isPlaying()) {
                    animationRef.current.pause();
                }
            }
            else {
                // Resume animation when tab becomes visible
                if (autoplay && animationRef.current.isPaused()) {
                    animationRef.current.play();
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [autoplay]);
    // Handle reduced motion preference
    useEffect(() => {
        if (OptimizationUtils.prefersReducedMotion() && animationRef.current) {
            animationRef.current.pause();
        }
    }, []);
    // Container styles
    const containerStyle = {
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
    };
    // Error state
    if (error) {
        return (jsxRuntimeExports.jsx("div", { ref: containerRef, className: className, style: containerStyle, role: "img", "aria-label": "Animation failed to load", children: jsxRuntimeExports.jsx("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    color: "#999",
                    fontSize: "14px",
                    textAlign: "center",
                }, children: "Failed to load animation" }) }));
    }
    // Loading state
    if (!isLoaded && isVisible) {
        return (jsxRuntimeExports.jsx("div", { ref: containerRef, className: className, style: containerStyle, role: "img", "aria-label": "Animation loading", children: jsxRuntimeExports.jsx("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    color: "#999",
                    fontSize: "14px",
                }, children: "Loading animation..." }) }));
    }
    return (jsxRuntimeExports.jsx("div", { ref: containerRef, className: className, style: containerStyle, role: "img", "aria-label": "Lottie animation" }));
});
LottiePlayer.displayName = "LottiePlayer";

/**
 * Powerful React hook for Lottie animations
 * Provides fine-grained control over animation playback
 */
function useLottie(options) {
    const { container, src, renderer = "canvas", autoplay = true, loop = true, speed = 1, direction = 1, segments, onComplete, onProgress, onError, onLoad, rendererSettings = {}, } = options;
    const animationRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isStopped, setIsStopped] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const [duration, setDuration] = useState(0);
    const [frameRate, setFrameRate] = useState(30);
    const [animationData, setAnimationData] = useState(null);
    const [error, setError] = useState(null);
    // Initialize animation
    useEffect(() => {
        if (!container.current || !src)
            return;
        let isCancelled = false;
        const loadAnimation = async () => {
            try {
                setError(null);
                // Load animation data
                const loaderResult = await LottieLoader.loadFromSource(src);
                if (isCancelled)
                    return;
                // Parse animation data
                const parsedAnimation = await LottieParser.parse({
                    data: loaderResult.data,
                    format: loaderResult.format,
                });
                if (isCancelled)
                    return;
                // Optimize based on device performance
                const deviceDetector = DeviceDetector.getInstance();
                const performanceClass = await deviceDetector.detectPerformance();
                const recommendedSettings = deviceDetector.getRecommendedSettings();
                // Use recommended renderer if device is low-end
                const finalRenderer = performanceClass === "low" ? recommendedSettings.renderer : renderer;
                // Create animation instance
                const animation = new Animation({
                    container: container.current,
                    renderer: finalRenderer,
                    loop,
                    autoplay,
                    animationData: parsedAnimation.data,
                    rendererSettings,
                });
                if (isCancelled) {
                    animation.destroy();
                    return;
                }
                // Configure animation
                animation.setSpeed(speed);
                animation.setDirection(direction);
                if (segments) {
                    animation.playSegments(segments);
                }
                // Set up event listeners
                animation.addEventListener("complete", () => {
                    setIsPlaying(false);
                    setIsPaused(false);
                    setIsStopped(true);
                    if (onComplete)
                        onComplete();
                });
                animation.addEventListener("enterFrame", () => {
                    const frame = animation.getCurrentFrame();
                    const prog = animation.getProgress();
                    setCurrentFrame(frame);
                    setProgress(prog);
                    if (onProgress)
                        onProgress(prog);
                });
                // Store animation reference and update state
                animationRef.current = animation;
                setAnimationData(parsedAnimation.data);
                setTotalFrames(animation.getTotalFrames());
                setDuration(animation.getDuration());
                setFrameRate(animation.getFrameRate());
                setIsLoaded(true);
                // Update playback state
                setIsPlaying(animation.isPlaying());
                setIsPaused(animation.isPaused());
                setIsStopped(animation.isStopped());
                if (onLoad) {
                    onLoad();
                }
            }
            catch (err) {
                if (!isCancelled) {
                    const error = err instanceof Error ? err : new Error("Failed to load animation");
                    setError(error);
                    if (onError) {
                        onError(error);
                    }
                }
            }
        };
        loadAnimation();
        return () => {
            isCancelled = true;
            if (animationRef.current) {
                animationRef.current.destroy();
                animationRef.current = null;
            }
        };
    }, [
        container,
        src,
        renderer,
        autoplay,
        loop,
        rendererSettings,
        onLoad,
        onError,
    ]);
    // Update animation properties when they change
    useEffect(() => {
        if (!animationRef.current)
            return;
        animationRef.current.setSpeed(speed);
    }, [speed]);
    useEffect(() => {
        if (!animationRef.current)
            return;
        animationRef.current.setDirection(direction);
    }, [direction]);
    useEffect(() => {
        if (!animationRef.current)
            return;
        if (segments) {
            animationRef.current.playSegments(segments);
        }
        else {
            animationRef.current.clearSegments();
        }
    }, [segments]);
    // Animation control methods
    const play = useCallback(() => {
        if (animationRef.current) {
            animationRef.current.play();
            setIsPlaying(true);
            setIsPaused(false);
            setIsStopped(false);
        }
    }, []);
    const pause = useCallback(() => {
        if (animationRef.current) {
            animationRef.current.pause();
            setIsPlaying(false);
            setIsPaused(true);
            setIsStopped(false);
        }
    }, []);
    const stop = useCallback(() => {
        if (animationRef.current) {
            animationRef.current.stop();
            setIsPlaying(false);
            setIsPaused(false);
            setIsStopped(true);
            setProgress(0);
            setCurrentFrame(0);
        }
    }, []);
    const seek = useCallback((newProgress) => {
        if (animationRef.current) {
            const clampedProgress = Math.max(0, Math.min(1, newProgress));
            animationRef.current.seek(clampedProgress);
            setProgress(clampedProgress);
            // Update current frame based on progress
            const frame = Math.round(clampedProgress * totalFrames);
            setCurrentFrame(frame);
        }
    }, [totalFrames]);
    const setSpeedCallback = useCallback((newSpeed) => {
        if (animationRef.current) {
            animationRef.current.setSpeed(newSpeed);
        }
    }, []);
    const setDirectionCallback = useCallback((newDirection) => {
        if (animationRef.current) {
            animationRef.current.setDirection(newDirection);
        }
    }, []);
    const goToAndPlay = useCallback((frame) => {
        if (animationRef.current) {
            animationRef.current.goToAndPlay(frame);
            setIsPlaying(true);
            setIsPaused(false);
            setIsStopped(false);
            // Update progress based on frame
            const newProgress = totalFrames > 0 ? frame / totalFrames : 0;
            setProgress(newProgress);
            setCurrentFrame(frame);
        }
    }, [totalFrames]);
    const goToAndStop = useCallback((frame) => {
        if (animationRef.current) {
            animationRef.current.goToAndStop(frame);
            setIsPlaying(false);
            setIsPaused(true);
            setIsStopped(false);
            // Update progress based on frame
            const newProgress = totalFrames > 0 ? frame / totalFrames : 0;
            setProgress(newProgress);
            setCurrentFrame(frame);
        }
    }, [totalFrames]);
    const playSegments = useCallback((newSegments, forceFlag = false) => {
        if (animationRef.current) {
            animationRef.current.playSegments(newSegments, forceFlag);
            setIsPlaying(true);
            setIsPaused(false);
            setIsStopped(false);
        }
    }, []);
    const setSubframe = useCallback((useSubFrames) => {
        if (animationRef.current) {
            animationRef.current.setSubframe(useSubFrames);
        }
    }, []);
    // Handle resize
    useEffect(() => {
        const handleResize = OptimizationUtils.debounce(() => {
            if (animationRef.current) {
                animationRef.current.resize();
            }
        }, 100);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return {
        play,
        pause,
        stop,
        seek,
        setSpeed: setSpeedCallback,
        setDirection: setDirectionCallback,
        goToAndPlay,
        goToAndStop,
        playSegments,
        setSubframe,
        isPlaying,
        isPaused,
        isStopped,
        progress,
        currentFrame,
        totalFrames,
        duration,
        frameRate,
        animationData,
        isLoaded,
        error,
    };
}
/**
 * Simple hook for basic Lottie animations
 * Provides minimal API for common use cases
 */
function useSimpleLottie(src, options = {}) {
    const containerRef = useRef(null);
    const lottie = useLottie({
        container: containerRef,
        src,
        ...options,
    });
    return {
        containerRef,
        ...lottie,
    };
}
/**
 * Hook for lazy-loaded Lottie animations
 * Only loads animation when element comes into view
 */
function useLazyLottie(src, options = {}) {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!containerRef.current)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: "50px", threshold: 0.1 });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);
    const lottie = useLottie({
        container: containerRef,
        src: isVisible ? src : "",
        ...options,
    });
    return {
        containerRef,
        isVisible,
        ...lottie,
    };
}
/**
 * Hook for scroll-triggered Lottie animations
 * Animation progress follows scroll position
 */
function useScrollLottie(src, options = {}) {
    const containerRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const lottie = useLottie({
        container: containerRef,
        src,
        autoplay: false,
        ...options,
    });
    useEffect(() => {
        const handleScroll = OptimizationUtils.throttle(() => {
            if (!containerRef.current)
                return;
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Calculate scroll progress when element is in viewport
            if (rect.top <= windowHeight && rect.bottom >= 0) {
                const elementHeight = rect.height;
                const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                const progress = visibleHeight / elementHeight;
                setScrollProgress(progress);
                lottie.seek(progress);
            }
        }, 16); // ~60fps
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial call
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lottie]);
    return {
        containerRef,
        scrollProgress,
        ...lottie,
    };
}
/**
 * Hook for hover-triggered Lottie animations
 * Plays animation on hover, reverses on leave
 */
function useHoverLottie(src, options = {}) {
    const containerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const lottie = useLottie({
        container: containerRef,
        src,
        autoplay: false,
        loop: false,
        ...options,
    });
    useEffect(() => {
        const element = containerRef.current;
        if (!element)
            return;
        const handleMouseEnter = () => {
            setIsHovered(true);
            lottie.setDirection(1);
            lottie.play();
        };
        const handleMouseLeave = () => {
            setIsHovered(false);
            lottie.setDirection(-1);
            lottie.play();
        };
        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [lottie]);
    return {
        containerRef,
        isHovered,
        ...lottie,
    };
}

export { Animation, CanvasRenderer, DeviceDetector, FrameRateLimiter, LazyLoadManager, LottieLoader, LottieParser, LottiePlayer, MemoryMonitor, OptimizationUtils, PerformanceMonitor, SVGRenderer, LottiePlayer as default, useHoverLottie, useLazyLottie, useLottie, useScrollLottie, useSimpleLottie };
//# sourceMappingURL=index.esm.js.map
