export declare class ScorecardItemDto {
    competency: string;
    weight: number;
    score: number;
    notes: string;
}
export declare class UpdateInterviewKitDto {
    scorecard?: ScorecardItemDto[];
}
export declare class UpdateScorecardDto {
    scorecard: ScorecardItemDto[];
}
