export type ReviewDecisionValue =
  | 'confirm_goal'
  | 'reject_goal'
  | 'mark_uncertain'
  | 'confirm_shot'
  | 'reject_shot';

export interface ReviewDecisionOption {
  value: ReviewDecisionValue | string;
  label: string;
  changes_goal_status: boolean;
}

export interface FrontendMatchSummary {
  summary_available: boolean;
  frontend_status: string;
  main_message: string;
  primary_action: string;
  primary_video_url: string | null;
  primary_camera_id: string | null;
  primary_camera_angle: string | null;
  has_review_clips: boolean;
  has_multicamera_event: boolean;
  requires_human_review: boolean;
  review_decision_endpoint: string | null;
  review_decision_type: string;
  review_decision_options: ReviewDecisionOption[];
  match_action_required: string;
  needs_review: boolean;
  camera_setup_valid: boolean | null;
  missing_required_angles: string[];
  warnings: string[];
}

export interface AnalyzeMatchResponse {
  frontend_match_summary: FrontendMatchSummary;
  match_multicamera_events?: Record<string, unknown>;
  match_review_summary?: Record<string, unknown>;
  match_action_required?: string;
  needs_review?: boolean;
}

export interface ReviewDecisionRequest {
  match_analysis_id?: string;
  event_id: string;
  decision: ReviewDecisionValue | string;
  camera_id?: string | null;
  camera_angle?: string | null;
  playback_url?: string | null;
  notes?: string;
}

export interface ReviewDecisionResponse {
  decision_received: boolean;
  decision_status: string;
  event_id: string;
  decision: string;
  manual_goal_status: string;
  manual_event_status: string;
  requires_persistence: boolean;
  persistence_status: string;
  message: string;
}

export interface AnalyzeMatchVideoParams {
  videoFile: File;
  matchMode?: string;
  cameraAngle?: string;
  runDetection?: boolean;
  runTracking?: boolean;
  runBallDetection?: boolean;
}

export interface AnalyzeMulticameraMatchParams {
  cam1File: File;
  cam2File: File;
  cam1Angle?: string;
  cam2Angle?: string;
  matchMode?: string;
  runDetection?: boolean;
  runTracking?: boolean;
  runBallDetection?: boolean;
}

interface ApiErrorBody {
  detail?: unknown;
  message?: unknown;
  errors?: unknown;
}

export const AI_API_BASE_URL = (
  import.meta.env.VITE_AI_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const getErrorText = (errorBody: ApiErrorBody | null): string | null => {
  if (!errorBody) return null;

  const detail = errorBody.detail ?? errorBody.message ?? errorBody.errors;

  if (!detail) return null;

  if (typeof detail === 'string') return detail;

  return JSON.stringify(detail);
};

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const errorBody = (await response.json()) as ApiErrorBody;
    return getErrorText(errorBody) || response.statusText;
  } catch {
    return response.statusText;
  }
};

const assertOkResponse = async (response: Response, endpoint: string) => {
  if (response.ok) return;

  const message = await parseErrorResponse(response);
  throw new Error(
    `AI service request failed for ${endpoint}: ${response.status} ${message}`,
  );
};

export const analyzeMatchVideo = async ({
  videoFile,
  matchMode = 'casual',
  cameraAngle = 'side_left',
  runDetection = true,
  runTracking = false,
  runBallDetection = false,
}: AnalyzeMatchVideoParams): Promise<AnalyzeMatchResponse> => {
  const formData = new FormData();
  formData.append('cam_1', videoFile);

  const queryParams = new URLSearchParams({
    match_mode: matchMode,
    cam_1_angle: cameraAngle,
    run_detection: String(runDetection),
    run_tracking: String(runTracking),
    run_ball_detection: String(runBallDetection),
  });

  const endpoint = `/analyze-match?${queryParams.toString()}`;
  const response = await fetch(`${AI_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  await assertOkResponse(response, '/analyze-match');

  return response.json() as Promise<AnalyzeMatchResponse>;
};

export const analyzeMulticameraMatch = async ({
  cam1File,
  cam2File,
  cam1Angle = 'side_left',
  cam2Angle = 'side_right',
  matchMode = 'casual',
  runDetection = true,
  runTracking = false,
  runBallDetection = true,
}: AnalyzeMulticameraMatchParams): Promise<AnalyzeMatchResponse> => {
  const formData = new FormData();
  formData.append('cam_1', cam1File);
  formData.append('cam_2', cam2File);

  const queryParams = new URLSearchParams({
    match_mode: matchMode,
    cam_1_angle: cam1Angle,
    cam_2_angle: cam2Angle,
    run_detection: String(runDetection),
    run_tracking: String(runTracking),
    run_ball_detection: String(runBallDetection),
  });

  const endpoint = `/analyze-match?${queryParams.toString()}`;
  const response = await fetch(`${AI_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  await assertOkResponse(response, '/analyze-match');

  return response.json() as Promise<AnalyzeMatchResponse>;
};

export const sendReviewDecision = async (
  request: ReviewDecisionRequest,
): Promise<ReviewDecisionResponse> => {
  const response = await fetch(`${AI_API_BASE_URL}/review-decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  await assertOkResponse(response, '/review-decision');

  return response.json() as Promise<ReviewDecisionResponse>;
};
