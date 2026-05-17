import orderBaseService from "./orderBase.service";
import orderRequestService from "./orderRequest.service";
import orderFulfillmentService from "./orderFulfillment.service";
import { mapOrder } from "./orderShared";

export const orderService = {
  ...orderBaseService,
  ...orderRequestService,
  ...orderFulfillmentService,
  mapOrder,
};

export default orderService;
