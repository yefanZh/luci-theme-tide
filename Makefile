#
# Copyright (C) 2026 yefan ZHANG <https://github.com/zhangyefan/luci-theme-tide>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Tide Theme
LUCI_DESCRIPTION:=Tide (澜) is an elegant, modern, high-contrast theme for LuCI featuring Ocean Blue and Graphite-Amber aesthetics.
LUCI_DEPENDS:=+luci-base +luci-mod-status
LUCI_PKGARCH:=all

PKG_NAME:=luci-theme-tide
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=yefan ZHANG

define Package/luci-theme-tide/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	if [ "$$(uci -q get luci.main.mediaurlbase)" = /luci-static/tide ]; then
		uci set luci.main.mediaurlbase=/luci-static/bootstrap
	fi
	uci -q delete luci.themes.Tide
	uci commit luci
}
endef

# luci.mk already invokes BuildPackage. Include it exactly once.
LUCI_MK:=$(firstword $(wildcard $(TOPDIR)/feeds/luci/luci.mk $(TOPDIR)/package/feeds/luci/luci/luci.mk ../../luci.mk))
ifeq ($(LUCI_MK),)
  $(error LuCI build rules not found. Install the luci feed before building Tide)
endif
include $(LUCI_MK)

# call BuildPackage - OpenWrt buildroot signature
