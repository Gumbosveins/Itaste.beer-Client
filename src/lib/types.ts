// Shapes returned by the ItbApi (camelCase JSON from ASP.NET Core)

export interface ApiResult {
  status: number
  message: string
}

export interface ReviewType {
  id: number
  reviewId: number
  displayOrder: number
  name: string
  maxValue: number
  abbr: string
}

export interface ReviewPart {
  id: number
  displayOrder: number
  reviewTypeId: number
  score: number
}

export interface BeverageReview {
  id: number
  username: string
  userId: string
  beverageId: number
  totalScore: number
  parts: ReviewPart[] | null
  comment: string | null
  includeInCalculations: boolean
}

export interface CategoryResult {
  reviewTypeId: number
  score: number
  name: string
  abbr: string
}

export interface ReviewResults extends ApiResult {
  totalScore: number
  partResults: CategoryResult[] | null
}

interface BeverageBase {
  id: number
  beverageId: number
  displayOrder: number
  name: string
  manufacturer: string
  alcoholPercentage: number
  groupName: string
  typeName: string
  isLocked: boolean
  imageUrlSm: string | null
  imageUrlMed: string | null
  ibu: number
}

export interface DashboardBeverage extends BeverageBase {
  desc: string | null
  reviews: BeverageReview[]
  reviewFinished: boolean
  results: ReviewResults
}

export interface DashboardUser {
  id: string
  username: string
}

export interface Dashboard extends ApiResult {
  code: string
  owner: string
  name: string
  pin: number
  isBlind: boolean
  blindRevealCode: string | null
  beverages: DashboardBeverage[]
  reviewTypes: ReviewType[]
  users: DashboardUser[]
}

export interface UserBeverage extends BeverageBase {
  review: BeverageReview
  finalScore: number
}

export interface UserRoom extends ApiResult {
  code: string
  name: string
  isBlind: boolean
  reviewTypes: ReviewType[]
  beverages: UserBeverage[]
}

export interface Brewery {
  id: number
  name: string
  lable: string | null
}

export interface Beer {
  id: number
  name: string
  lableSM: string | null
  lableMed: string | null
  ibu: number
  percent: number
  description: string | null
  untappedRating: number
  brewery: Brewery
  type: string
}

export interface ReviewTypeOption {
  id: number
  name: string
  isNew: boolean
}

export interface CreateRoomResult extends ApiResult {
  roomCode: string
}

export interface JoinRoomResult extends ApiResult {
  userId: string
}

export interface NewUserJoinedEvent {
  username: string
  userId: string
}

export interface FinalScoreEvent {
  beerId: number
  finalScore: number
}
