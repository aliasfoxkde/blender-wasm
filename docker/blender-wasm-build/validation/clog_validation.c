#include "CLG_log.h"

const char *bw_validation_status(void)
{
  CLG_init();
  CLG_level_set(0);
  CLG_exit();
  return "{\"success\":true,\"linked\":\"bf_intern_clog\",\"called\":[\"CLG_init\",\"CLG_level_set\",\"CLG_exit\"]}";
}

