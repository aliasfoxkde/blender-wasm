/**
 * WebGPU type augmentations for browsers that support the WebGPU API.
 * The standard TypeScript lib does not include navigator.gpu types.
 */

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance' | 'default';
  forceFallbackAdapter?: boolean;
}

interface GPUAdapter {
  name: string;
  vendor?: string;
  device: GPUDevice;
  info: GPUAdapterInfo;
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

interface GPUSupportedFeatures {
  has(feature: string): boolean;
}

interface GPUSupportedLimits {
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
  maxDynamicUniformBuffersPerPipelineLayout: number;
  maxDynamicStorageBuffersPerPipelineLayout: number;
  maxSampledTexturesPerShaderStage: number;
  maxSamplersPerShaderStage: number;
  maxStorageBuffersPerShaderStage: number;
  maxStorageTexturesPerShaderStage: number;
  maxUniformBuffersPerShaderStage: number;
  maxUniformBufferBindingSize: number;
  maxStorageBufferBindingSize: number;
  minUniformBufferOffsetAlignment: number;
  minStorageBufferOffsetAlignment: number;
}

interface GPUDeviceDescriptor {
  label?: string;
  requiredFeatures?: string[];
  requiredLimits?: Record<string, number>;
}

interface GPUDevice extends GPUDeviceBase {
  adapter: GPUAdapter;
}

interface GPUDeviceBase {
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  queue: GPUQueue;
  destroy(): void;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createBufferMapped(descriptor: GPUBufferDescriptor): GPUBufferMapped;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
  createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;
}

interface GPUBufferDescriptor {
  size: number;
  usage: GPUBufferUsageFlags;
  mappedAtCreation?: boolean;
}

type GPUBufferUsageFlags = number;

interface GPUBuffer {
  size: number;
  usage: GPUBufferUsageFlags;
  mapMode?: number;
  destroy(): void;
  mapAsync(mode: number, offset?: number, size?: number): Promise<void>;
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  unmap(): void;
}

interface GPUBufferMapped {
  data: ArrayBuffer;
  buffer: GPUBuffer;
}

interface GPUTextureDescriptor {
  size: GPUExtent3D;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
}

type GPUTextureDimension = '1d' | '2d' | '3d';
type GPUTextureUsageFlags = number;

interface GPUTexture {
  width: number;
  height: number;
  depth: number;
  mipLevelCount: number;
  sampleCount: number;
  dimension: GPUTextureDimension;
  format: GPUTextureFormat;
  destroy(): void;
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
}

interface GPUTextureViewDescriptor {
  format?: GPUTextureFormat;
  dimension?: GPUTextureViewDimension;
  baseMipLevel?: number;
  mipLevelCount?: number;
  baseArrayLayer?: number;
  arrayLayerCount?: number;
}

type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';

type GPUTextureFormat =
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  | 'rgba32float'
  | 'rgba32uint'
  | 'rgba32sint'
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb';

interface GPUTextureView {
  texture: GPUTexture;
  format: GPUTextureFormat;
  dimension: GPUTextureViewDimension;
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
  destroy(): void;
}

interface GPUSamplerDescriptor {
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  addressModeW?: GPUAddressMode;
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUFilterMode;
  lodMinClamp?: number;
  lodMaxClamp?: number;
  compare?: GPUCompareFunction;
}

type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
type GPUFilterMode = 'nearest' | 'linear';
type GPUCompareFunction = 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

interface GPUSampler {
  destroy(): void;
}

type GPUExtent3D = number | { width: number; height?: number; depth?: number } | { width: number; height: number; depth?: number } | { width: number; height: number; depth: number };

interface GPUBindGroupLayoutDescriptor {
  entries: GPUBindGroupLayoutEntry[];
}

interface GPUBindGroupLayoutEntry {
  binding: number;
  visibility: GPUShaderStageFlags;
  buffer?: GPUBufferBindingLayout;
  sampler?: GPUSamplerBindingLayout;
  texture?: GPUTextureBindingLayout;
  storageTexture?: GPUStorageTextureBindingLayout;
}

type GPUShaderStageFlags = number;

interface GPUBufferBindingLayout {
  type?: GPUBufferBindingType;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

type GPUBufferBindingType = 'uniform' | 'storage' | 'read-only-storage';

interface GPUSamplerBindingLayout {
  type?: GPUSamplerBindingType;
}

type GPUSamplerBindingType = 'filtering' | 'non-filtering' | 'comparison';

interface GPUTextureBindingLayout {
  sampleType?: GPUTextureSampleType;
  viewDimension?: GPUTextureViewDimension;
  multisampled?: boolean;
}

type GPUTextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';

interface GPUStorageTextureBindingLayout {
  access?: GPUStorageTextureAccess;
  format: GPUTextureFormat;
  viewDimension?: GPUTextureViewDimension;
}

type GPUStorageTextureAccess = 'read-only' | 'read-write' | 'write-only';

interface GPUPipelineLayoutDescriptor {
  bindGroupLayouts: GPUBindGroupLayout[];
}

interface GPUPipelineLayout {
  destroy(): void;
}

interface GPUBindGroup {
  destroy(): void;
}

interface GPUPipelineBase {
  destroy(): void;
}

interface GPUComputePipelineDescriptor {
  layout?: GPUPipelineLayout;
  compute: GPUProgrammableStage;
}

interface GPUComputePipeline extends GPUPipelineBase {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPURenderPipelineDescriptor {
  layout?: GPUPipelineLayout;
  vertex: GPUVertexState;
  fragment?: GPUFragmentState;
  primitive?: GPUPrimitiveState;
  depthStencil?: GPUDepthStencilState;
  multisample?: GPUMultisampleState;
}

interface GPURenderPipeline extends GPUPipelineBase {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUProgrammableStage {
  module: GPUShaderModule;
  entryPoint: string;
  constants?: Record<string, number>;
}

interface GPUVertexState {
  module: GPUShaderModule;
  entryPoint: string;
  buffers?: GPUVertexBufferLayout[];
}

interface GPUFragmentState {
  module: GPUShaderModule;
  entryPoint: string;
  targets: GPUColorTargetState[];
}

interface GPUColorTargetState {
  format: GPUTextureFormat;
  blend?: GPUBlendState;
  writeMask?: GPUColorWriteFlags;
}

interface GPUBlendState {
  color: GPUBlendComponent;
  alpha: GPUBlendComponent;
}

interface GPUBlendComponent {
  operation?: GPUBlendOperation;
  srcFactor?: GPUBlendFactor;
  dstFactor?: GPUBlendFactor;
}

type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';
type GPUBlendFactor = 'zero' | 'one' | 'src' | 'one-minus-src' | 'src-alpha' | 'one-minus-src-alpha' | 'dst' | 'one-minus-dst' | 'dst-alpha' | 'one-minus-dst-alpha' | 'src-alpha-saturated' | 'constant' | 'one-minus-constant';
type GPUColorWriteFlags = number;

interface GPUPrimitiveState {
  topology?: GPUPrimitiveTopology;
  stripIndexFormat?: GPUIndexFormat;
  frontFace?: GPUFrontFace;
  cullMode?: GPUCullMode;
}

type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
type GPUIndexFormat = 'uint16' | 'uint32';
type GPUFrontFace = 'ccw' | 'cw';
type GPUCullMode = 'none' | 'front' | 'back';

interface GPUDepthStencilState {
  format: GPUTextureFormat;
  depthWriteEnabled?: boolean;
  depthCompare?: GPUCompareFunction;
  stencilFront?: GPUStencilStateFace;
  stencilBack?: GPUStencilStateFace;
  stencilReadMask?: number;
  stencilWriteMask?: number;
  depthBias?: number;
  depthBiasClamp?: number;
  depthBiasSlopeScale?: number;
}

interface GPUStencilStateFace {
  compare?: GPUCompareFunction;
  failOp?: GPUStencilOperation;
  depthFailOp?: GPUStencilOperation;
  passOp?: GPUStencilOperation;
}

type GPUStencilOperation = 'keep' | 'zero' | 'replace' | 'increment-clamp' | 'decrement-clamp' | 'invert' | 'increment-wrap' | 'decrement-wrap';

interface GPUMultisampleState {
  count?: number;
  mask?: number;
  alphaToCoverageEnabled?: boolean;
}

interface GPUVertexBufferLayout {
  arrayStride: number;
  stepMode?: GPUVertexStepMode;
  attributes?: GPUVertexAttribute[];
}

type GPUVertexStepMode = 'vertex' | 'instance';
type GPUExtent3D = { width: number; height?: number; depth?: number } | { width: number; height: number; depth?: number } | { width: number; height: number; depth: number };

interface GPUVertexAttribute {
  format: GPUVertexFormat;
  offset: number;
  shaderLocation: number;
}

type GPUVertexFormat = 'uint8x2' | 'uint8x4' | 'sint8x2' | 'sint8x4' | 'unorm8x2' | 'unorm8x4' | 'snorm8x2' | 'snorm8x4' | 'uint16x2' | 'uint16x4' | 'sint16x2' | 'sint16x4' | 'unorm16x2' | 'unorm16x4' | 'snorm16x2' | 'snorm16x4' | 'float16x2' | 'float16x4' | 'float32' | 'float32x2' | 'float32x3' | 'float32x4' | 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4' | 'sint32' | 'sint32x2' | 'sint32x3' | 'sint32x4';

interface GPUShaderModuleDescriptor {
  code: string | Uint32Array | Uint8Array;
  sourceMap?: object;
}

interface GPUShaderModule {
  destroy(): void;
  getCompilationInfo(): Promise<GPUCompilationInfo>;
}

interface GPUCompilationInfo {
  messages: GPUCompilationMessage[];
}

interface GPUCompilationMessage {
  message: string;
  type: GPUCompilationMessageType;
  lineNum: number;
  linePos: number;
}

type GPUCompilationMessageType = 'error' | 'warning' | 'info';

interface GPUCommandEncoderDescriptor {
  label?: string;
}

interface GPUCommandEncoder {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
  destroy(): void;
}

interface GPUComputePassDescriptor {
  label?: string;
}

interface GPURenderPassDescriptor {
  colorAttachments: GPURenderPassColorAttachment[];
  depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
}

interface GPURenderPassColorAttachment {
  view: GPUTextureView;
  resolveTarget?: GPUTextureView;
  loadOp: GPULoadOp;
  storeOp: GPUStoreOp;
  clearValue?: GPUColor;
}

type GPULoadOp = 'load' | 'clear';
type GPUStoreOp = 'store' | 'discard';

interface GPUColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface GPURenderPassDepthStencilAttachment {
  view: GPUTextureView;
  depthLoadOp?: GPULoadOp;
  depthStoreOp?: GPUStoreOp;
  depthClearValue?: number;
  depthReadOnly?: boolean;
  stencilLoadOp?: GPULoadOp;
  stencilStoreOp?: GPUStoreOp;
  stencilClearValue?: number;
  stencilReadOnly?: boolean;
}

interface GPUCommandBufferDescriptor {
  label?: string;
}

interface GPUCommandBuffer {
  submit(inputs?: GPUCommandBuffer[]): void;
  destroy(): void;
}

interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup | null, dynamicOffsets?: number[]): void;
  dispatchWorkgroups(workgroupX: number, workgroupY?: number, workgroupZ?: number): void;
  dispatchWorkgroupsIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  end(): void;
  destroy(): void;
}

interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup | null, dynamicOffsets?: number[]): void;
  setVertexBuffer(slot: number, buffer: GPUBuffer | null, offset?: number, size?: number): void;
  setIndexBuffer(buffer: GPUBuffer | null, indexFormat?: GPUIndexFormat, offset?: number, size?: number): void;
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
  drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  end(): void;
  destroy(): void;
}

interface GPURenderBundleEncoderDescriptor extends GPURenderPassDescriptor {
  depthStencilFormat?: GPUTextureFormat;
  sampleCount?: number;
}

interface GPURenderBundleEncoder {
  finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
}

interface GPURenderBundleDescriptor {
  label?: string;
}

interface GPURenderBundle {
  execute(): void;
  destroy(): void;
}

interface GPUQueue {
  submit(commands: GPUCommandBuffer[]): void;
  signal(buffer: GPUBuffer, signalValue: number): void;
  wait(buffer: GPUBuffer, signalValue: number, timeout?: number): Promise<void>;
  onSubmittedWorkDone(): Promise<void>;
  destroy(): void;
}

interface GPUBindGroupLayout {
  destroy(): void;
}

interface GPUDeviceQueue {
  submit(commands: GPUCommandBuffer[]): void;
}

interface Navigator {
  readonly gpu?: GPU;
}
